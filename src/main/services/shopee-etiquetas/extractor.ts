import sharp from 'sharp'
import type { ParsedZplPage } from './zpl-parser'
import { graphicToRawGrayscale } from './zpl-parser'
import { LocalOcrService, type OcrResult } from './ocr.service'
import { normalizeChecklistItem, type EquivalenceLookup, normalizeKey, type SkuResolver } from './normalizer'

type OcrWord = { text: string; confidence: number; x0: number; y0: number; x1: number; y1: number }

export type SourceBounds = { x: number; y: number; width: number; height: number }

export type ExtractedItem = {
  productRaw: string
  variationRaw: string
  fabricRaw: string
  colorRaw: string
  quantity: number
  quantityRaw: string
  sku: string
  skuRaw: string
  fabricName: string
  colorName: string
  cutMm: number | null
  widthMm: number | null
  confidence: number
  validationSource: 'ocr' | 'equivalence' | 'safe_rule'
  reviewReason: string | null
  reviewRequired: boolean
  sourceBounds: SourceBounds | null
}

export type ExtractedPage = {
  type: 'envio' | 'checklist' | 'desconhecida'
  orderId: string | null
  packageNumber: number | null
  confidence: number
  warnings: string[]
  items: ExtractedItem[]
  sourceImage: { rotationDegrees: number; width: number; height: number } | null
}

export function clipSourceBounds(
  bounds: { x0: number; y0: number; x1: number; y1: number },
  imageWidth: number,
  imageHeight: number,
  padding = 8
): SourceBounds {
  const x = Math.max(0, Math.floor(bounds.x0 - padding))
  const y = Math.max(0, Math.floor(bounds.y0 - padding))
  const right = Math.min(imageWidth, Math.ceil(bounds.x1 + padding))
  const bottom = Math.min(imageHeight, Math.ceil(bounds.y1 + padding))
  return { x, y, width: Math.max(1, right - x), height: Math.max(1, bottom - y) }
}

function parseTsv(tsv: string): OcrWord[] {
  const lines = tsv.split(/\r?\n/)
  const words: OcrWord[] = []
  for (const line of lines.slice(1)) {
    const cells = line.split('\t')
    if (cells.length < 12 || cells[0] !== '5') continue
    const text = cells.slice(11).join('\t').trim()
    const confidence = Number(cells[10])
    if (!text || !Number.isFinite(confidence) || confidence < 0) continue
    const left = Number(cells[6])
    const top = Number(cells[7])
    const width = Number(cells[8])
    const height = Number(cells[9])
    words.push({ text, confidence, x0: left, y0: top, x1: left + width, y1: top + height })
  }
  return words
}

function normalizeOcr(value: string): string {
  return normalizeKey(value).replace(/\b0NT\b/g, 'QNT')
}

function extractOrderId(text: string): string | null {
  const normalized = text.replace(/[|]/g, 'I')
  return (
    normalized.match(/(?:ID\s*(?:DO\s*)?PEDIDO|PEDIDO)\s*[:#-]?\s*([0-9A-Z-]{8,})/i)?.[1] ??
    normalized.match(/\b([0-9][0-9A-Z-]{9,})\s+PACKAGE\s+\d+/i)?.[1] ??
    null
  )?.replace(/[^0-9A-Z-]/gi, '') ?? null
}

function extractPackage(text: string): number | null {
  const match = text.match(/PACKAGE\s*[:#-]?\s*(\d+)/i)
  return match ? Number.parseInt(match[1], 10) : null
}

function classify(text: string): 'envio' | 'checklist' | 'desconhecida' {
  const key = normalizeOcr(text)
  if (key.includes('CHECKLIST') || (key.includes('PRODUTO') && key.includes('SKU'))) return 'checklist'
  if (key.includes('DESTINATARIO') || key.includes('REMETENTE') || key.includes('DANFE')) return 'envio'
  return 'desconhecida'
}

function joinWords(words: OcrWord[]): string {
  const lines: Array<{ y: number; words: OcrWord[] }> = []
  for (const word of [...words].sort((a, b) => a.y0 - b.y0 || a.x0 - b.x0)) {
    const centerY = (word.y0 + word.y1) / 2
    const line = lines.find((candidate) => Math.abs(candidate.y - centerY) <= 12)
    if (line) {
      line.words.push(word)
      line.y = line.words.reduce((sum, item) => sum + (item.y0 + item.y1) / 2, 0) / line.words.length
    } else {
      lines.push({ y: centerY, words: [word] })
    }
  }
  return lines
    .sort((a, b) => a.y - b.y)
    .flatMap((line) => line.words.sort((a, b) => a.x0 - b.x0))
    .map((word) => word.text)
    .join(' ')
    .replace(/\s+([,.;:])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractRows(
  result: OcrResult,
  imageWidth: number,
  imageHeight: number,
  lookup: EquivalenceLookup,
  resolveSku?: SkuResolver
): ExtractedItem[] {
  const words = parseTsv(result.tsv)
  const headerWords = words.filter((word) => /PRODUTO|VARIA|QNT|QTD|SKU/.test(normalizeOcr(word.text)))
  const headerY = headerWords.length
    ? Math.min(...headerWords.map((word) => word.y0))
    : Math.round(words.reduce((sum, word) => sum + word.y0, 0) / Math.max(1, words.length))
  const variationHeader = headerWords.find((word) => normalizeOcr(word.text).startsWith('VARIA'))
  const quantityHeader = headerWords.find((word) => /QNT|QTD/.test(normalizeOcr(word.text)))
  const skuHeader = headerWords.find((word) => normalizeOcr(word.text).includes('SKU'))
  const boundaries = [
    variationHeader ? Math.max(imageWidth * 0.35, variationHeader.x0 - 12) : imageWidth * 0.46,
    quantityHeader ? quantityHeader.x0 - 12 : imageWidth * 0.76,
    skuHeader ? skuHeader.x0 - 12 : imageWidth * 0.84
  ]
  const dataWords = words.filter((word) => word.y0 > headerY + 12)
  const skuCandidates = dataWords.filter((word) => (word.x0 + word.x1) / 2 >= boundaries[2])
  const anchorGroups: Array<{ y: number; words: OcrWord[] }> = []
  for (const word of skuCandidates.sort((a, b) => a.y0 - b.y0)) {
    const centerY = (word.y0 + word.y1) / 2
    const group = anchorGroups.find((candidate) => Math.abs(candidate.y - centerY) <= 18)
    if (group) {
      group.words.push(word)
      group.y = group.words.reduce((sum, item) => sum + (item.y0 + item.y1) / 2, 0) / group.words.length
    } else {
      anchorGroups.push({ y: centerY, words: [word] })
    }
  }
  const anchors = anchorGroups.filter((group) => /[A-Z].*[0-9]|[0-9].*[A-Z]|-/.test(normalizeOcr(joinWords(group.words))))
  const items: ExtractedItem[] = []
  for (let index = 0; index < anchors.length; index += 1) {
    const previousY = index === 0 ? headerY + 10 : (anchors[index - 1].y + anchors[index].y) / 2
    const nextY = index === anchors.length - 1 ? anchors[index].y + 120 : (anchors[index].y + anchors[index + 1].y) / 2
    const rowWords = dataWords.filter((word) => {
      const centerY = (word.y0 + word.y1) / 2
      return centerY >= previousY && centerY < nextY
    })
    const productRaw = joinWords(rowWords.filter((word) => (word.x0 + word.x1) / 2 < boundaries[0]))
    const variationRaw = joinWords(rowWords.filter((word) => {
      const x = (word.x0 + word.x1) / 2
      return x >= boundaries[0] && x < boundaries[1]
    }))
    const quantityRaw = joinWords(rowWords.filter((word) => {
      const x = (word.x0 + word.x1) / 2
      return x >= boundaries[1] && x < boundaries[2]
    }))
    const skuRaw = joinWords(rowWords.filter((word) => (word.x0 + word.x1) / 2 >= boundaries[2]))
    const normalized = normalizeChecklistItem(productRaw, variationRaw, quantityRaw, skuRaw, lookup, resolveSku)
    const confidence = rowWords.length
      ? rowWords.reduce((sum, word) => sum + word.confidence, 0) / rowWords.length
      : 0
    const sourceBounds = rowWords.length
      ? clipSourceBounds({
          x0: Math.min(...rowWords.map((word) => word.x0)),
          y0: previousY,
          x1: Math.max(...rowWords.map((word) => word.x1)),
          y1: nextY
        }, imageWidth, imageHeight)
      : null
    items.push({
      productRaw,
      variationRaw,
      ...normalized,
      confidence,
      reviewRequired: normalized.reviewRequired ||
        (Math.round(confidence) < 80 && normalized.validationSource !== 'equivalence') || !productRaw || !variationRaw,
      reviewReason: normalized.reviewReason ?? (Math.round(confidence) < 80 && normalized.validationSource !== 'equivalence'
        ? 'Leitura inédita com baixa qualidade; confirme os dados.'
        : !productRaw || !variationRaw ? 'Produto ou variação não identificado.' : null),
      sourceBounds
    })
  }
  return items
}

function extractDirect(page: ParsedZplPage, lookup: EquivalenceLookup, resolveSku?: SkuResolver): ExtractedPage {
  const text = page.text
  const type = classify(text)
  const field = (label: string) => text.match(new RegExp(`(?:${label})\\s*[:=-]\\s*([^\\n]+)`, 'i'))?.[1]?.trim() ?? ''
  const items: ExtractedItem[] = []
  if (type === 'checklist') {
    const productRaw = field('Produto')
    const variationRaw = field('Varia(?:ção|cao)')
    const normalized = normalizeChecklistItem(productRaw, variationRaw, field('Qnt|Qtd'), field('SKU'), lookup, resolveSku)
    items.push({ productRaw, variationRaw, ...normalized, confidence: 100, reviewRequired: normalized.reviewRequired, sourceBounds: null })
  }
  return {
    type,
    orderId: extractOrderId(text),
    packageNumber: extractPackage(text),
    confidence: 100,
    warnings: type === 'desconhecida' ? ['Tipo de página não reconhecido.'] : [],
    items,
    sourceImage: null
  }
}

export async function extractPage(page: ParsedZplPage, lookup: EquivalenceLookup, resolveSku?: SkuResolver): Promise<ExtractedPage> {
  if (page.method === 'fd') return extractDirect(page, lookup, resolveSku)
  if (!page.graphic) throw new Error('Página Z64 sem gráfico associado.')
  const raw = graphicToRawGrayscale(page.graphic)
  const png = await sharp(raw, {
    raw: { width: page.graphic.width, height: page.graphic.height, channels: 1 }
  }).png().toBuffer()
  const oriented = await LocalOcrService.orientAndRecognize(png)
  const metadata = await sharp(oriented.image).metadata()
  const type = classify(oriented.result.text)
  const warnings: string[] = []
  if (type === 'desconhecida') warnings.push('Tipo de página não reconhecido pelo OCR.')
  const items = type === 'checklist'
    ? extractRows(oriented.result, metadata.width ?? page.graphic.width, metadata.height ?? page.graphic.height, lookup, resolveSku)
    : []
  if (type === 'checklist' && items.length === 0) warnings.push('Nenhuma linha de produto foi reconhecida.')
  return {
    type,
    orderId: extractOrderId(oriented.result.text),
    packageNumber: extractPackage(oriented.result.text),
    confidence: oriented.result.confidence,
    warnings,
    items,
    sourceImage: {
      rotationDegrees: oriented.angle,
      width: metadata.width ?? page.graphic.width,
      height: metadata.height ?? page.graphic.height
    }
  }
}

export const extractorInternals = { parseTsv, extractRows, classify, extractOrderId }
