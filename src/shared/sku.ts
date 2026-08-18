/**
 * Gera o SKU de 4 caracteres para tecidos conforme a regra de negócio:
 * - 2 primeiros caracteres da primeira palavra
 * - 2 primeiros caracteres da última palavra
 * - Se tiver apenas 1 palavra, usa os 4 primeiros caracteres dessa palavra
 *
 * Exemplos:
 * - "Anarruga" -> "ANAR"
 * - "Cetim" -> "CETI"
 * - "Cetim com Elastano" -> "CEEL"
 * - "Linho Puro Rústico" -> "LIRU"
 */
export function generateTecidoSku(nome: string): string {
  if (!nome || !nome.trim()) return 'XXXX'

  const clean = nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim()

  const allTokens = clean.split(/\s+/).filter((w) => w.length > 0)

  if (allTokens.length === 0) return 'XXXX'

  // Filtra tokens puramente numéricos (como '100' proveniente de '100%') para priorizar palavras reais
  const letterTokens = allTokens.filter((w) => /[a-zA-Z]/.test(w))
  const words = letterTokens.length > 0 ? letterTokens : allTokens

  if (words.length === 1) {
    const single = words[0]
    return single.slice(0, 4).padEnd(4, 'X').toUpperCase()
  }

  const firstWord = words[0]
  const lastWord = words[words.length - 1]

  const p1 = firstWord.slice(0, 2).padEnd(2, 'X')
  const p2 = lastWord.slice(0, 2).padEnd(2, 'X')

  return (p1 + p2).toUpperCase()
}
