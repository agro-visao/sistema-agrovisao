import { error } from '../../admin/_auth.js';
import { getProductById } from '../../admin/_products.js';
import { fetchImage, b2Configured } from '../../admin/_b2.js';

// Endpoint público de imagens. O bucket B2 é privado, então a imagem é buscada
// pelo backend com o token de autorização e entregue aqui (o navegador nunca
// acessa o B2 diretamente e nenhum segredo/token sai da função).
export async function onRequest(context) {
  const { request, params } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 204 });
  if (request.method !== 'GET') return error('Method not allowed', 405);

  const id = parseInt(params.id, 10);
  if (!Number.isInteger(id) || id <= 0) return error('Produto inválido.', 400);

  try {
    const db = context.env.DB;
    if (!db) return error('Database not available', 503);

    const product = await getProductById(db, id);
    if (!product || !product.b2FileKey) {
      return error('Imagem não encontrada.', 404);
    }

    if (!b2Configured(context.env)) {
      return error('Servidor B2 não configurado.', 503);
    }

    const imgRes = await fetchImage(context.env, product.b2FileKey);
    if (!imgRes.ok) {
      if (imgRes.status === 401 || imgRes.status === 403 || imgRes.status === 404) {
        return error('Imagem não encontrada.', 404);
      }
      return error('Falha ao carregar imagem do B2.', imgRes.status);
    }

    return new Response(imgRes.body, {
      status: 200,
      headers: {
        'Content-Type': product.mimeType || imgRes.headers.get('Content-Type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=86400',
      },
    });
  } catch (e) {
    console.error('[products] erro ao carregar imagem:', e.message);
    return error('Erro ao carregar imagem.', 500);
  }
}
