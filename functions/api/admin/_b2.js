// ─── Upload/download/destroy de imagens no Backblaze B2 (bucket privado) ─────
// O bucket permanece privado: nunca geramos URLs públicas. O backend usa a B2
// API (b2_authorize_account → b2_get_upload_url → b2_upload_file) e as imagens
// são servidas pelo endpoint público /api/products/[id]/image, que faz proxy
// do B2 com o token de autorização (nunca exposto ao navegador).
// No D1 fica apenas a referência: b2_file_key, b2_file_id, mime_type, width, height.

export const IMAGE_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'webp']);
const B2_API_URL = 'https://api.backblazeb2.com/b2api/v2';
const SESSION_TTL_MS = 60 * 60 * 1000; // renovação da autorização a cada 1h

export function b2Configured(env) {
  return Boolean(
    env.B2_APPLICATION_KEY_ID &&
    env.B2_APPLICATION_KEY &&
    env.B2_BUCKET_ID &&
    env.B2_BUCKET_NAME
  );
}

// Cache compartilhado do isolate: token de conta + URL de upload. Válido por
// ~24h na B2, mas renovamos a cada 1h para não segurar sessão inválida.
let b2SessionCache = { accountToken: null, apiUrl: null, downloadUrl: null, uploadUrl: null, uploadToken: null, expiresAt: 0 };

async function b2Session(env) {
  const now = Date.now();
  if (b2SessionCache.accountToken && b2SessionCache.expiresAt > now) {
    return b2SessionCache;
  }

  const credentials = btoa(`${env.B2_APPLICATION_KEY_ID}:${env.B2_APPLICATION_KEY}`);
  const authRes = await fetch(`${B2_API_URL}/b2_authorize_account`, {
    method: 'POST',
    headers: { Authorization: `Basic ${credentials}` },
  });
  if (!authRes.ok) {
    const detail = (await authRes.text().catch(() => '')) || authRes.statusText;
    throw new Error(`Falha ao autenticar no Backblaze B2 (${authRes.status}). ${detail.slice(0, 200)}`);
  }
  const auth = await authRes.json();

  const uploadRes = await fetch(`${B2_API_URL}/b2_get_upload_url`, {
    method: 'POST',
    headers: { Authorization: auth.authorizationToken },
    body: JSON.stringify({ bucketId: env.B2_BUCKET_ID }),
  });
  if (!uploadRes.ok) {
    const detail = (await uploadRes.text().catch(() => '')) || uploadRes.statusText;
    throw new Error(`Falha ao preparar upload no Backblaze B2 (${uploadRes.status}). ${detail.slice(0, 200)}`);
  }
  const upload = await uploadRes.json();

  b2SessionCache = {
    accountToken: auth.authorizationToken,
    apiUrl: auth.apiUrl,
    downloadUrl: auth.downloadUrl,
    uploadUrl: upload.uploadUrl,
    uploadToken: upload.authorizationToken,
    expiresAt: now + SESSION_TTL_MS,
  };
  return b2SessionCache;
}

// Validação do arquivo: extensão, MIME declarado e magic bytes (o tipo enviado
// pelo navegador é controlável pelo cliente, então o conteúdo é verificado).
export async function validateImageFile(file) {
  if (!file || typeof file.size !== 'number' || file.size <= 0) {
    return { ok: false, error: 'Selecione um arquivo de imagem.' };
  }
  if (file.size > IMAGE_MAX_BYTES) {
    return { ok: false, error: 'A imagem deve ter no máximo 5 MB.' };
  }
  const ext = (file.name || '').split('.').pop().toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    return { ok: false, error: 'Extensão inválida. Use .jpg, .jpeg, .png ou .webp.' };
  }
  const declared = String(file.type || '').toLowerCase();
  if (!ALLOWED_MIME.has(declared)) {
    return { ok: false, error: 'Tipo MIME inválido. Use JPG, PNG ou WEBP.' };
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const sniffed = sniffImageType(bytes);
  if (!sniffed || sniffed !== declared) {
    return { ok: false, error: 'O conteúdo do arquivo não é uma imagem JPG, PNG ou WEBP válida.' };
  }
  return { ok: true, data: { bytes, mimeType: sniffed } };
}

function sniffImageType(bytes) {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'image/png';
  }
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return 'image/webp';
  }
  return null;
}

const MIME_EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export function makeFileKey(slug, mimeType) {
  const ext = MIME_EXT[mimeType] || 'jpg';
  return `agrovisao/products/${slug}-${Date.now()}.${ext}`;
}

async function sha1Hex(bytes) {
  const digest = await crypto.subtle.digest('SHA-1', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function uploadImage(env, { bytes, mimeType, fileKey }) {
  const session = await b2Session(env);
  const sha1 = await sha1Hex(bytes);

  const res = await fetch(session.uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: session.uploadToken,
      'X-Bz-File-Name': fileKey,
      'X-Bz-Content-Sha1': sha1,
      'Content-Type': mimeType,
    },
    body: bytes,
  });
  if (!res.ok) {
    const detail = (await res.text().catch(() => '')) || res.statusText;
    throw new Error(`Falha no upload para o Backblaze B2 (${res.status}). ${detail.slice(0, 200)}`);
  }
  const body = await res.json();
  return {
    fileKey: body.fileName,
    fileId: body.fileId,
    mimeType,
    width: null,
    height: null,
  };
}

// Proxy de leitura: busca o binário no bucket privado com o token de conta.
export async function fetchImage(env, fileKey) {
  const session = await b2Session(env);
  const url = `${session.downloadUrl}/file/${env.B2_BUCKET_NAME}/${fileKey}`;
  return fetch(url, {
    headers: { Authorization: session.accountToken },
  });
}

export async function destroyImage(env, fileId, fileKey) {
  if (!fileId || !fileKey || !b2Configured(env)) return;
  try {
    const session = await b2Session(env);
    const res = await fetch(`${B2_API_URL}/b2_delete_file_version`, {
      method: 'POST',
      headers: { Authorization: session.accountToken },
      body: JSON.stringify({ fileId, fileName: fileKey }),
    });
    if (!res.ok && res.status !== 404) {
      const detail = (await res.text().catch(() => '')) || res.statusText;
      throw new Error(`Falha ao remover imagem do Backblaze B2 (${res.status}). ${detail.slice(0, 200)}`);
    }
  } catch (e) {
    // Não relança: o registro já foi excluído; falha na remoção remota não deixa
    // o produto inconsistente no D1 (a imagem pode ser limpa depois).
    console.error('[admin] falha ao remover imagem do B2:', e.message);
  }
}
