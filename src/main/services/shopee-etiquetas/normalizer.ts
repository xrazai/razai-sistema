export type EquivalenceLookup = (
  kind: 'tecido' | 'cor',
  sourceKey: string,
  sku: string
) => string | null

export type SkuResolution = {
  sku: string
  source: 'ocr' | 'equivalence' | 'safe_rule'
  ambiguous: boolean
}

export type SkuResolver = (rawSku: string) => SkuResolution

export type NormalizedChecklistItem = {
  fabricRaw: string
  colorRaw: string
  fabricName: string
  colorName: string
  cutMm: number | null
  widthMm: number | null
  quantity: number
  quantityRaw: string
  sku: string
  skuRaw: string
  validationSource: 'ocr' | 'equivalence' | 'safe_rule'
  reviewReason: string | null
  reviewRequired: boolean
}

export function normalizeKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

function decimalToMillimeters(value: string): number | null {
  const meters = Number.parseFloat(value.replace(',', '.'))
  if (!Number.isFinite(meters) || meters <= 0) return null
  return Math.round(meters * 1000)
}

function inferFabric(product: string): string | null {
  const key = normalizeKey(product)
  if (/HELANCA|GELANCA/.test(key)) return 'HELANCA'
  if (key.includes('LINHO MISTO')) return 'LINHO MISTO'
  if (key.includes('LINHO RUSTICO')) return 'LINHO RÚSTICO'
  if (key.includes('ANARRUGA')) return 'ANARRUGA'
  if (key.includes('CETIM')) return 'CETIM'
  if (key.includes('VELUDO CRISTAL')) return 'VELUDO CRISTAL'
  return null
}

function canonicalColor(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('pt-BR')
    .replace(/(^|\s|[-/])\p{L}/gu, (letter) => letter.toLocaleUpperCase('pt-BR'))
}

export function normalizeSku(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[^A-Z0-9-]+/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function isOcrConfusion(left: string, right: string): boolean {
  return (left === 'O' && right === '0') || (left === '0' && right === 'O') ||
    (left === 'I' && right === '1') || (left === '1' && right === 'I')
}

export function resolveKnownSku(
  rawSku: string,
  knownSkus: readonly string[],
  exactAlias: string | null = null
): SkuResolution {
  const normalized = normalizeSku(rawSku)
  if (exactAlias) return { sku: normalizeSku(exactAlias), source: 'equivalence', ambiguous: false }
  const canonical = [...new Set(knownSkus.map(normalizeSku).filter(Boolean))]
  const bases = new Set([normalized])
  if (normalized.startsWith('I') && normalized.length > 1) bases.add(normalized.slice(1))
  const candidates = canonical.filter((candidate) => candidate !== normalized && [...bases].some((base) => {
    if (base.length !== candidate.length) return false
    let changes = 0
    for (let index = 0; index < base.length; index += 1) {
      if (base[index] === candidate[index]) continue
      if (!isOcrConfusion(base[index], candidate[index])) return false
      changes += 1
      if (changes > 1) return false
    }
    return changes > 0 || base !== normalized
  }))
  const unique = [...new Set(candidates)]
  if (canonical.includes(normalized)) {
    return { sku: normalized, source: 'ocr', ambiguous: unique.length > 0 }
  }
  if (unique.length === 1) return { sku: unique[0], source: 'safe_rule', ambiguous: false }
  return { sku: normalized, source: 'ocr', ambiguous: unique.length > 1 }
}

export function normalizeChecklistItem(
  productRaw: string,
  variationRaw: string,
  quantityRaw: string | number,
  skuRaw: string,
  lookup: EquivalenceLookup,
  resolveSku: SkuResolver = (value) => ({ sku: normalizeSku(value), source: 'ocr', ambiguous: false })
): NormalizedChecklistItem {
  const skuResolution = resolveSku(skuRaw)
  const sku = skuResolution.sku
  const productKey = normalizeKey(productRaw)
  const variation = variationRaw.replace(/\s+/g, ' ').trim()
  const dimensions = variation.match(/([0-9]+(?:[.,][0-9]+)?)(?:[ILM])?\s*m\s*[x×]\s*([0-9]+(?:[.,][0-9]+)?)\s*m/i)
  const cutMm = dimensions ? decimalToMillimeters(dimensions[1]) : null
  let widthMm = dimensions ? decimalToMillimeters(dimensions[2]) : null
  const productWidth = productRaw.match(/([0-9]+[.,][0-9]+)\s*m/i)
  const productWidthMm = productWidth ? decimalToMillimeters(productWidth[1]) : null
  if (widthMm && productWidthMm && Math.abs(widthMm - productWidthMm) <= 100) widthMm = productWidthMm
  const colorRaw = (dimensions ? variation.slice(0, dimensions.index) : variation)
    .replace(/^[^\p{L}]+/u, '')
    .replace(/^I(?=[A-ZÀ-Ý][a-zà-ÿ])/u, '')
    .replace(/[,;]\s*$/, '')
    .trim()
  const colorKey = normalizeKey(colorRaw)
  const quantityText = String(quantityRaw).trim()
  const quantity = Math.max(0, Number.parseInt(quantityText.replace(/\D/g, ''), 10) || 0)

  let fabricName = lookup('tecido', productKey, sku)
  if (!fabricName) {
    const entries = [
      ['TECIDO MALHA HELANCA', 'HELANCA'],
      ['TECIDO LINHO MISTO', 'LINHO MISTO'],
      ['TECIDO LINHO RUSTICO', 'LINHO RÚSTICO'],
      ['TECIDO CETIM', 'CETIM'],
      ['TECIDO ANARRUGA', 'ANARRUGA'],
      ['TECIDO VELUDO CRISTAL', 'VELUDO CRISTAL']
    ] as const
    fabricName = entries.find(([key]) => productKey.includes(key))?.[1] ?? inferFabric(productRaw)
  }

  const colorName = lookup('cor', colorKey, sku) ?? (colorRaw ? canonicalColor(colorRaw) : '')
  const missing: string[] = []
  if (!fabricName) missing.push('tecido')
  if (!colorName) missing.push('cor')
  if (!cutMm) missing.push('corte')
  if (quantity < 1) missing.push('quantidade')
  if (!sku) missing.push('SKU')
  if (skuResolution.ambiguous) missing.push('SKU ambíguo')
  return {
    fabricRaw: productRaw,
    colorRaw,
    fabricName: fabricName ?? '',
    colorName,
    cutMm,
    widthMm,
    quantity,
    quantityRaw: quantityText,
    sku,
    skuRaw,
    validationSource: skuResolution.source,
    reviewReason: missing.length ? `Verificar ${missing.join(', ')}.` : null,
    reviewRequired: missing.length > 0
  }
}

export function formatMeters(mm: number): string {
  const meters = mm / 1000
  return `${meters.toLocaleString('pt-BR', { maximumFractionDigits: 3 })}m`
}
