/**
 * Normaliza e formata o input HEX em tempo real para o padrão '#RRGGBB' em maiúsculas
 */
export function formatHexInput(val: string): string {
  let clean = val.replace(/[^0-9a-fA-F#]/g, '').toUpperCase()
  if (clean && !clean.startsWith('#')) {
    clean = `#${clean}`
  }
  return clean.slice(0, 7)
}

/**
 * Valida se a string é um HEX de 6 dígitos válido (#RRGGBB)
 */
export function isValidHex(hex: string): boolean {
  return /^#[0-9A-F]{6}$/.test(hex)
}

/**
 * Converte valores do espaço de cor CIE-L*a*b* (D65) para representação sRGB HEX (#RRGGBB).
 * Aceita entradas como "83,25 / 08,12 / 85,34", "83.25 / 8.12 / 85.34", etc.
 */
export function labToHex(labStr: string): string | null {
  if (!labStr || !labStr.trim()) return null

  // Divide por barras ou separadores
  const parts = labStr
    .split('/')
    .map((p) => parseFloat(p.trim().replace(',', '.')))
    .filter((n) => !isNaN(n))

  if (parts.length < 3) return null

  const [L, a, b] = parts

  // L deve estar entre 0 e 100
  if (L < 0 || L > 100) return null

  // Conversão L*a*b* -> XYZ (Iluminante D65)
  const fy = (L + 16) / 116
  const fx = a / 500 + fy
  const fz = fy - b / 200

  const fInv = (t: number) => (t > 0.20689655172 ? t ** 3 : 0.12841854934 * (t - 0.13793103448))

  const X = 0.95047 * fInv(fx)
  const Y = 1.00000 * fInv(fy)
  const Z = 1.08883 * fInv(fz)

  // Conversão XYZ -> sRGB Linear (matriz padrão sRGB D65)
  const rLin =  3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z
  const gLin = -0.9692660 * X + 1.8760108 * Y + 0.0415560 * Z
  const bLin =  0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z

  // Correção Gamma sRGB
  const gamma = (c: number) =>
    c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(Math.max(0, c), 1 / 2.4) - 0.055

  const r = Math.min(255, Math.max(0, Math.round(gamma(rLin) * 255)))
  const g = Math.min(255, Math.max(0, Math.round(gamma(gLin) * 255)))
  const bVal = Math.min(255, Math.max(0, Math.round(gamma(bLin) * 255)))

  const toHex = (n: number) => n.toString(16).padStart(2, '0').toUpperCase()
  return `#${toHex(r)}${toHex(g)}${toHex(bVal)}`
}

/**
 * Converte uma cor HEX (#RRGGBB) para a representação textual LAB "00,00 / 00,00 / 00,00"
 */
export function hexToLab(hex: string): string | null {
  if (!isValidHex(hex)) return null

  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255

  // Inverso Gamma sRGB
  const invGamma = (c: number) =>
    c > 0.04045 ? Math.pow((c + 0.055) / 1.055, 2.4) : c / 12.92

  const rLin = invGamma(r)
  const gLin = invGamma(g)
  const bLin = invGamma(b)

  // sRGB Linear -> XYZ
  const X = (0.4124564 * rLin + 0.3575761 * gLin + 0.1804375 * bLin) / 0.95047
  const Y = (0.2126729 * rLin + 0.7151522 * gLin + 0.0721750 * bLin) / 1.00000
  const Z = (0.0193339 * rLin + 0.1191920 * gLin + 0.9503041 * bLin) / 1.08883

  const f = (t: number) => (t > 0.00885645167 ? Math.cbrt(t) : 7.787037037 * t + 0.13793103448)

  const fx = f(X)
  const fy = f(Y)
  const fz = f(Z)

  const L = 116 * fy - 16
  const A = 500 * (fx - fy)
  const B = 200 * (fy - fz)

  const formatPart = (n: number) => {
    const formatted = (Math.round(n * 100) / 100).toFixed(2).replace('.', ',')
    return formatted.padStart(5, '0')
  }

  return `${formatPart(L)} / ${formatPart(A)} / ${formatPart(B)}`
}
