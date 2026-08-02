// ─── Validação da imagem já processada ──────────────────────────────────────
// O navegador (src/lib/imageProcessor.ts) redimensiona e converte para WEBP
// antes de enviar. Aqui o servidor confere o que chegou de fato: assinatura
// WEBP nos bytes, teto de peso e limite de dimensão do perfil.
//
// As dimensões são lidas do cabeçalho RIFF/VP8 do próprio arquivo — o que o
// formulário declara é ignorado, já que o cliente controla o multipart.

// `maxBytes` é o alvo do processamento (best-effort: fotos muito ruidosas
// podem estourar), `hardMaxBytes` é o limite que o servidor recusa.
export const PRODUCT_IMAGE = {
  label: 'produto',
  maxDimension: 1600,
  maxBytes: 400 * 1024,
  hardMaxBytes: 2 * 1024 * 1024,
};

export const GALLERY_IMAGE = {
  label: 'galeria',
  maxDimension: 1800,
  maxBytes: 1024 * 1024,
  hardMaxBytes: 3 * 1024 * 1024,
};

export async function validateProcessedImage(file, profile) {
  if (!file || typeof file.size !== 'number' || file.size <= 0) {
    return { ok: false, error: 'Selecione um arquivo de imagem.' };
  }
  if (file.size > profile.hardMaxBytes) {
    const limit = Math.round(profile.hardMaxBytes / 1024);
    return { ok: false, error: `A imagem processada excedeu ${limit} KB. Envie uma foto menor.` };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!isWebp(bytes)) {
    return { ok: false, error: 'A imagem precisa ser convertida para WEBP antes do envio.' };
  }

  const size = readWebpDimensions(bytes);
  if (!size) {
    return { ok: false, error: 'Não foi possível ler as dimensões da imagem WEBP.' };
  }
  if (size.width > profile.maxDimension || size.height > profile.maxDimension) {
    return {
      ok: false,
      error: `A imagem deve ter no máximo ${profile.maxDimension} px no maior lado.`,
    };
  }

  return {
    ok: true,
    data: {
      bytes,
      mimeType: 'image/webp',
      size: bytes.length,
      width: size.width,
      height: size.height,
    },
  };
}

function isWebp(bytes) {
  return (
    bytes.length >= 16 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  );
}

// Os três formatos de chunk do WEBP guardam o tamanho em lugares diferentes:
// VP8 (lossy, o que o canvas gera), VP8L (lossless) e VP8X (estendido).
export function readWebpDimensions(bytes) {
  const chunk = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]);
  const p = 20; // início do payload do primeiro chunk

  if (chunk === 'VP8 ') {
    if (bytes.length < p + 10) return null;
    if (bytes[p + 3] !== 0x9d || bytes[p + 4] !== 0x01 || bytes[p + 5] !== 0x2a) return null;
    return {
      width: ((bytes[p + 6] | (bytes[p + 7] << 8)) & 0x3fff),
      height: ((bytes[p + 8] | (bytes[p + 9] << 8)) & 0x3fff),
    };
  }

  if (chunk === 'VP8L') {
    if (bytes.length < p + 5 || bytes[p] !== 0x2f) return null;
    const b0 = bytes[p + 1];
    const b1 = bytes[p + 2];
    const b2 = bytes[p + 3];
    const b3 = bytes[p + 4];
    return {
      width: 1 + (((b1 & 0x3f) << 8) | b0),
      height: 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)),
    };
  }

  if (chunk === 'VP8X') {
    if (bytes.length < p + 10) return null;
    return {
      width: 1 + (bytes[p + 4] | (bytes[p + 5] << 8) | (bytes[p + 6] << 16)),
      height: 1 + (bytes[p + 7] | (bytes[p + 8] << 8) | (bytes[p + 9] << 16)),
    };
  }

  return null;
}

// Sufixo aleatório porque um mesmo salvamento pode gravar mais de um arquivo
// no mesmo milissegundo.
export function makeImagePath(slug, index = 0) {
  const rand = Math.random().toString(36).slice(2, 8);
  return `products/${slug}-${Date.now()}-${index}-${rand}.webp`;
}

export function makeGalleryImagePath(projectSlug, index = 0) {
  const safeSlug = String(projectSlug || 'projeto')
    .toLowerCase()
    .normalize('NFD')
    .replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'projeto';
  const rand = Math.random().toString(36).slice(2, 8);
  return `project-images/${safeSlug}-${Date.now()}-${index}-${rand}.webp`;
}
