// ─── Conversão automática das imagens antes do upload ───────────────────────
// O cliente escolhe um JPG/PNG/WEBP qualquer e o painel redimensiona e converte
// para WEBP aqui, no navegador (Canvas), sem pedir edição manual. O servidor
// recebe o arquivo já pronto e revalida os bytes.
//
// Roda no navegador porque o runtime das Cloudflare Pages Functions não tem
// decodificação de imagem (não existe OffscreenCanvas nem createImageBitmap).

export interface ImageProfile {
  /** Limite do maior lado, em pixels. */
  maxDimension: number
  /** Peso desejado do arquivo final — best-effort, não é garantia. */
  targetBytes: number
}

export const PRODUCT_IMAGE_PROFILE: ImageProfile = {
  maxDimension: 1600,
  targetBytes: 400 * 1024,
}

export const GALLERY_IMAGE_PROFILE: ImageProfile = {
  maxDimension: 1800,
  targetBytes: 1024 * 1024,
}

export const PROJECT_LOGO_PROFILE: ImageProfile = {
  maxDimension: 1000,
  targetBytes: 300 * 1024,
}

export interface ProcessedImage {
  file: File
  width: number
  height: number
  size: number
  mimeType: 'image/webp'
}

export const ACCEPTED_INPUT_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_SOURCE_BYTES = 5 * 1024 * 1024

// A busca começa no topo da faixa pedida (82%) e desce até 75%. Abaixo disso a
// perda fica visível, então o arquivo é aceito mesmo acima do alvo.
const QUALITY_STEPS = [0.82, 0.8, 0.78, 0.76, 0.75]

export class ImageProcessingError extends Error {}

export function validateSourceFile(file: File): string {
  if (!ACCEPTED_INPUT_TYPES.includes(file.type) || !/\.(jpe?g|png|webp)$/i.test(file.name)) {
    return 'Formato inválido. Use JPG, PNG ou WEBP.'
  }
  if (file.size > MAX_SOURCE_BYTES) {
    return 'A imagem deve ter no máximo 5 MB.'
  }
  return ''
}

export async function processImage(file: File, profile: ImageProfile): Promise<ProcessedImage> {
  const sourceError = validateSourceFile(file)
  if (sourceError) throw new ImageProcessingError(sourceError)

  const bitmap = await decode(file)
  try {
    const { width, height } = fitWithin(bitmap.width, bitmap.height, profile.maxDimension)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new ImageProcessingError('Não foi possível processar a imagem neste navegador.')
    ctx.drawImage(bitmap, 0, 0, width, height)

    const blob = await encodeSmallest(canvas, profile.targetBytes)
    return {
      file: new File([blob], toWebpName(file.name), { type: 'image/webp' }),
      width,
      height,
      size: blob.size,
      mimeType: 'image/webp',
    }
  } finally {
    bitmap.close()
  }
}

async function decode(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file)
  } catch {
    throw new ImageProcessingError('Não foi possível ler a imagem. Verifique se o arquivo não está corrompido.')
  }
}

// Nunca amplia: uma foto menor que o limite é mantida no tamanho original.
function fitWithin(width: number, height: number, maxDimension: number) {
  const largest = Math.max(width, height)
  if (largest <= maxDimension) return { width, height }
  const ratio = maxDimension / largest
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  }
}

// Para na primeira qualidade que couber no alvo; se nenhuma couber, devolve a
// menor das tentativas em vez de falhar.
async function encodeSmallest(canvas: HTMLCanvasElement, targetBytes: number): Promise<Blob> {
  let smallest: Blob | null = null
  for (const quality of QUALITY_STEPS) {
    const blob = await toWebpBlob(canvas, quality)
    if (blob.size <= targetBytes) return blob
    if (!smallest || blob.size < smallest.size) smallest = blob
  }
  if (!smallest) throw new ImageProcessingError('Falha ao converter a imagem para WEBP.')
  return smallest
}

function toWebpBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob && blob.type === 'image/webp') resolve(blob)
        else reject(new ImageProcessingError('Este navegador não consegue gerar imagens WEBP.'))
      },
      'image/webp',
      quality
    )
  })
}

function toWebpName(name: string): string {
  const base = name.replace(/\.[^.]+$/, '') || 'imagem'
  return `${base}.webp`
}
