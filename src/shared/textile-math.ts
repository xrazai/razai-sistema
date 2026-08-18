/**
 * Utilitários e fórmulas matemáticas de Engenharia Têxtil
 * 
 * Relações Fundamentais:
 * - GL (Gramatura Linear em g/m) = 1000 / R = GM * L
 * - GM (Gramatura Superficial em g/m²) = GL / L = 1000 / (R * L)
 * - R (Rendimento em m/kg) = 1000 / GL = 1000 / (GM * L)
 * 
 * Onde:
 * - L = Largura em metros (m)
 * - R = Rendimento em metros por quilo (m/kg)
 * - GL = Gramatura linear em gramas por metro (g/m)
 * - GM = Gramatura superficial em gramas por metro quadrado (g/m²)
 */

/**
 * Converte string no padrão brasileiro (com vírgula) para number
 */
export function parsePtBrNumber(val: string | number | null | undefined): number | null {
  if (val === null || val === undefined) return null
  if (typeof val === 'number') {
    return isNaN(val) || val <= 0 ? null : val
  }
  const clean = String(val).replace(/\s+/g, '').replace(',', '.')
  const num = parseFloat(clean)
  return isNaN(num) || num <= 0 ? null : num
}

/**
 * Arredonda gramatura (linear ou m²) para a dezena inteira mais próxima (ex: 273 -> 270, 186 -> 190)
 */
export function roundGramatura(val: number): number {
  if (isNaN(val) || val <= 0) return 0
  return Math.round(val / 10) * 10
}

/**
 * Arredonda rendimento para o intervalo de 0,5 mais próximo (ex: 2,78 -> 3,00; 2,64 -> 2,50)
 */
export function roundRendimento(val: number): number {
  if (isNaN(val) || val <= 0) return 0
  return Math.round(val * 2) / 2
}

/**
 * Formata um número para o padrão de exibição PT-BR (com vírgula)
 */
export function formatPtBrNumber(val: number | null | undefined, decimals?: number): string {
  if (val === null || val === undefined || isNaN(val)) return ''
  if (typeof decimals === 'number') {
    return val.toFixed(decimals).replace('.', ',')
  }
  return String(val).replace('.', ',')
}

export type CalculatedMetrics = {
  rendimento: number
  gramaturaLinear: number
  gramaturaM2: number
}

/**
 * Calcula GL e GM a partir da Largura (L) e Rendimento (R)
 */
export function calculateMetricsFromRendimento(largura: number, rendimento: number): CalculatedMetrics {
  if (largura <= 0 || rendimento <= 0) {
    throw new Error('Largura e Rendimento devem ser maiores que zero.')
  }
  const rawGL = 1000 / rendimento
  const rawGM = rawGL / largura
  return {
    rendimento: roundRendimento(rendimento),
    gramaturaLinear: roundGramatura(rawGL),
    gramaturaM2: roundGramatura(rawGM)
  }
}

/**
 * Calcula R e GM a partir da Largura (L) e Gramatura Linear (GL)
 */
export function calculateMetricsFromGramaturaLinear(largura: number, gramaturaLinear: number): CalculatedMetrics {
  if (largura <= 0 || gramaturaLinear <= 0) {
    throw new Error('Largura e Gramatura Linear devem ser maiores que zero.')
  }
  const rawR = 1000 / gramaturaLinear
  const rawGM = gramaturaLinear / largura
  return {
    rendimento: roundRendimento(rawR),
    gramaturaLinear: roundGramatura(gramaturaLinear),
    gramaturaM2: roundGramatura(rawGM)
  }
}

/**
 * Calcula GL e R a partir da Largura (L) e Gramatura Superficial (GM)
 */
export function calculateMetricsFromGramaturaM2(largura: number, gramaturaM2: number): CalculatedMetrics {
  if (largura <= 0 || gramaturaM2 <= 0) {
    throw new Error('Largura e Gramatura Superficial devem ser maiores que zero.')
  }
  const rawGL = gramaturaM2 * largura
  const rawR = 1000 / rawGL
  return {
    rendimento: roundRendimento(rawR),
    gramaturaLinear: roundGramatura(rawGL),
    gramaturaM2: roundGramatura(gramaturaM2)
  }
}
