import sharp from 'sharp'
import type { ShopeeEtiquetaSourceBounds, ShopeeEtiquetaSourcePreview } from '../../../shared/shopee-etiquetas'
import { loadExactZplDocument } from './document-loader'
import { ShopeeEtiquetasRepository } from './repository'
import { graphicToRawGrayscale, parseZpl } from './zpl-parser'

function assertBounds(bounds: ShopeeEtiquetaSourceBounds, width: number, height: number): void {
  if (
    bounds.x < 0 || bounds.y < 0 || bounds.width <= 0 || bounds.height <= 0 ||
    bounds.x + bounds.width > width || bounds.y + bounds.height > height
  ) {
    throw new Error('A área de leitura salva não corresponde às dimensões da etiqueta.')
  }
}

export class ShopeeEtiquetaSourcePreviewService {
  static async getItemSourcePreview(itemId: string): Promise<ShopeeEtiquetaSourcePreview> {
    const source = ShopeeEtiquetasRepository.getItemPreviewSource(itemId)
    if (!source) throw new Error('Linha de revisão não encontrada.')
    if (source.method !== 'z64') throw new Error('Esta etiqueta possui origem textual e não tem imagem para destacar.')
    if (
      source.rotationDegrees === null || source.imageWidth === null || source.imageHeight === null ||
      source.sourceX === null || source.sourceY === null || source.sourceWidth === null || source.sourceHeight === null
    ) {
      throw new Error('Reimporte o lote para visualizar a origem desta linha.')
    }
    if (!source.storedPath) throw new Error('O arquivo original expirou ou não está disponível.')

    const document = await loadExactZplDocument(source.storedPath, source.entryName, source.documentHash)
    const page = parseZpl(document).pages[source.pageOrder]
    if (!page?.graphic || page.method !== 'z64') throw new Error('A página original da etiqueta não foi encontrada.')
    if (source.rasterHash && page.graphic.hash !== source.rasterHash) {
      throw new Error('A imagem original foi alterada desde a extração.')
    }

    const raw = graphicToRawGrayscale(page.graphic)
    const image = await sharp(raw, {
      raw: { width: page.graphic.width, height: page.graphic.height, channels: 1 }
    }).rotate(source.rotationDegrees).threshold(180).png().toBuffer()
    const metadata = await sharp(image).metadata()
    const width = metadata.width ?? 0
    const height = metadata.height ?? 0
    if (width !== source.imageWidth || height !== source.imageHeight) {
      throw new Error('As dimensões da etiqueta não correspondem à extração original.')
    }

    const highlight = {
      x: source.sourceX,
      y: source.sourceY,
      width: source.sourceWidth,
      height: source.sourceHeight
    }
    assertBounds(highlight, width, height)
    return {
      mimeType: 'image/png',
      imageBase64: image.toString('base64'),
      width,
      height,
      highlight,
      entryName: source.entryName,
      pageNumber: source.pageOrder + 1
    }
  }
}

export const sourcePreviewInternals = { assertBounds }
