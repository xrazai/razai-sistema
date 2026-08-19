/**
 * Normaliza o texto removendo diacríticos/acentos e convertendo para minúsculas
 */
export function normalizeUnaccent(text: string | null | undefined): string {
  if (!text) return ''
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

/**
 * Valida se o nome da cor contém exatamente 2 palavras (Família + Variação).
 */
export function validateCorNome(nome: string): { valid: boolean; words: string[]; error?: string } {
  if (!nome || !nome.trim()) {
    return { valid: false, words: [], error: 'O campo "Nome da cor" é obrigatório.' }
  }

  const clean = normalizeUnaccent(nome)
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim()

  const allTokens = clean.split(/\s+/).filter((w) => w.length > 0)
  const words = allTokens.filter((w) => /[a-zA-Z0-9]/.test(w))

  if (words.length !== 2) {
    return {
      valid: false,
      words,
      error: 'O campo "Nome da cor" deve conter exatamente 2 palavras: Família e Variação (ex: "Azul Marinho", "Verde Militar").'
    }
  }

  return { valid: true, words }
}

/**
 * Gera o SKU base de 8 caracteres para cores conforme a regra de negócio:
 * - 4 primeiros caracteres da família (primeira palavra), preenchendo com 'X' se tiver menos de 4
 * - 4 primeiros caracteres da variação (segunda palavra), preenchendo com 'X' se tiver menos de 4
 *
 * Exemplos:
 * - "Azul Marinho" -> "AZULMARI"
 * - "Verde Militar" -> "VERDMILI"
 * - "Rosa Chá" -> "ROSACHAX"
 * - "Roxo Pá" -> "ROXOPAXX"
 */
export function generateCorSku(nome: string): string {
  if (!nome || !nome.trim()) return 'XXXXXXXX'

  const clean = normalizeUnaccent(nome)
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim()

  const words = clean.split(/\s+/).filter((w) => w.length > 0)
  if (words.length === 0) return 'XXXXXXXX'

  const fam = words[0] || ''
  const varia = words.length > 1 ? words[1] : ''

  const fam4 = fam.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).padEnd(4, 'X').toUpperCase()
  const var4 = varia
    ? varia.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).padEnd(4, 'X').toUpperCase()
    : 'XXXX'

  return fam4 + var4
}

/**
 * Gera lista ordenada de candidatos a SKU para cores em caso de colisão:
 * 1. SKU Base (4 da família + 4 da variação)
 * 2. Mudar as duas últimas letras da variação pegando outras combinações da última palavra
 * 3. Mudar as duas primeiras letras da variação pegando outras combinações da última palavra
 * 4. Permutações alfabéticas (A-Z) sem números
 */
export function getCorSkuCandidates(nome: string): string[] {
  const clean = normalizeUnaccent(nome)
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim()

  const words = clean.split(/\s+/).filter((w) => w.length > 0)
  if (words.length === 0) return ['XXXXXXXX']

  const famClean = (words[0] || '').replace(/[^a-zA-Z]/g, '').toUpperCase()
  const varClean = (words.length > 1 ? words[1] : '').replace(/[^a-zA-Z]/g, '').toUpperCase()

  const fam4 = famClean.slice(0, 4).padEnd(4, 'X')
  const baseVar4 = varClean.slice(0, 4).padEnd(4, 'X')

  const candidates: string[] = []
  const seen = new Set<string>()

  function addCandidate(sku: string) {
    const formatted = sku.slice(0, 8).padEnd(8, 'X').toUpperCase()
    if (!seen.has(formatted)) {
      seen.add(formatted)
      candidates.push(formatted)
    }
  }

  // 1. Base
  addCandidate(fam4 + baseVar4)

  const varPrefix = varClean.slice(0, 2).padEnd(2, 'X')

  // 2. Passo 1: Mudar as 2 últimas letras da variação (mantém fam4 + varPrefix)
  // 2a. Pares de letras na variação a partir do índice 2 em diante
  if (varClean.length >= 3) {
    for (let i = 2; i < varClean.length; i++) {
      for (let j = i + 1; j < varClean.length; j++) {
        addCandidate(fam4 + varPrefix + varClean[i] + varClean[j])
      }
    }
  }
  // 2b. Quaisquer pares de letras em varClean para as 2 últimas posições
  for (let i = 0; i < varClean.length; i++) {
    for (let j = i + 1; j < varClean.length; j++) {
      addCandidate(fam4 + varPrefix + varClean[i] + varClean[j])
    }
  }
  // 2c. Letras individuais com padding 'X'
  for (let i = 0; i < varClean.length; i++) {
    addCandidate(fam4 + varPrefix + varClean[i] + 'X')
  }

  // 3. Passo 2: Mudar as 2 primeiras letras que compõem a variação do SKU
  if (varClean.length >= 2) {
    for (let i = 0; i < varClean.length; i++) {
      for (let j = i + 1; j < varClean.length; j++) {
        const altPrefix = varClean[i] + varClean[j]
        // Combina com pares subsequentes da palavra
        for (let k = j + 1; k < varClean.length; k++) {
          for (let l = k + 1; l < varClean.length; l++) {
            addCandidate(fam4 + altPrefix + varClean[k] + varClean[l])
          }
        }
        // Combina com as duas últimas do base
        const baseSuffix = baseVar4.slice(2, 4)
        addCandidate(fam4 + altPrefix + baseSuffix)
      }
    }
  }

  // 4. Passo 3: Permutação alfabética pura (A-Z) sem números
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  // Variação das 2 últimas letras
  for (let i = 0; i < letters.length; i++) {
    for (let j = 0; j < letters.length; j++) {
      addCandidate(fam4 + varPrefix + letters[i] + letters[j])
    }
  }
  // Variação das 4 letras da variação
  for (let i = 0; i < letters.length; i++) {
    for (let j = 0; j < letters.length; j++) {
      for (let k = 0; k < letters.length; k++) {
        for (let l = 0; l < letters.length; l++) {
          addCandidate(fam4 + letters[i] + letters[j] + letters[k] + letters[l])
        }
      }
    }
  }

  return candidates
}

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

  const clean = normalizeUnaccent(nome)
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

/**
 * Gera lista ordenada de candidatos a SKU para tecidos em caso de colisão:
 * 1. SKU Base de 4 caracteres
 * 2. Mantém a 1ª parte e busca nova combinação de letras a partir da última palavra
 * 3. Tenta palavras intermediárias (se houver) mantendo a 1ª parte
 * 4. Tenta novas combinações da 1ª palavra combinadas com a última
 * 5. Permutações alfabéticas puras (A-Z) sem números
 */
export function getTecidoSkuCandidates(nome: string): string[] {
  if (!nome || !nome.trim()) return ['XXXX']

  const clean = normalizeUnaccent(nome)
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim()

  const allTokens = clean.split(/\s+/).filter((w) => w.length > 0)
  if (allTokens.length === 0) return ['XXXX']

  const letterTokens = allTokens.filter((w) => /[a-zA-Z]/.test(w))
  const words = letterTokens.length > 0 ? letterTokens : allTokens

  const candidates: string[] = []
  const seen = new Set<string>()

  function addCandidate(sku: string) {
    const formatted = sku.slice(0, 4).padEnd(4, 'X').toUpperCase()
    if (!seen.has(formatted)) {
      seen.add(formatted)
      candidates.push(formatted)
    }
  }

  // 1. Base
  const base = generateTecidoSku(nome)
  addCandidate(base)

  const cleanWords = words.map((w) => w.replace(/[^a-zA-Z]/g, '').toUpperCase())

  if (cleanWords.length === 1) {
    const single = cleanWords[0]
    const p1 = single.slice(0, 2).padEnd(2, 'X')

    // 2. Varia os 2 últimos caracteres usando outras combinações da própria palavra
    for (let i = 2; i < single.length; i++) {
      for (let j = i + 1; j < single.length; j++) {
        addCandidate(p1 + single[i] + single[j])
      }
    }
    for (let i = 0; i < single.length; i++) {
      for (let j = i + 1; j < single.length; j++) {
        addCandidate(p1 + single[i] + single[j])
      }
    }
    // 3. Varia os 2 primeiros caracteres
    for (let i = 0; i < single.length; i++) {
      for (let j = i + 1; j < single.length; j++) {
        const altP1 = single[i] + single[j]
        for (let k = j + 1; k < single.length; k++) {
          for (let l = k + 1; l < single.length; l++) {
            addCandidate(altP1 + single[k] + single[l])
          }
        }
      }
    }
  } else {
    const firstWord = cleanWords[0]
    const lastWord = cleanWords[cleanWords.length - 1]
    const p1 = firstWord.slice(0, 2).padEnd(2, 'X')

    // 2. Mantém p1 e busca nova combinação de letras na última palavra (começando pela última parte do SKU)
    // 2a. Pares a partir de índice 1 ou 2
    for (let i = 0; i < lastWord.length; i++) {
      for (let j = i + 1; j < lastWord.length; j++) {
        addCandidate(p1 + lastWord[i] + lastWord[j])
      }
    }
    // 2b. Letras individuais da última palavra com padding
    for (let i = 0; i < lastWord.length; i++) {
      addCandidate(p1 + lastWord[i] + 'X')
    }

    // 3. Palavras intermediárias (se houver)
    if (cleanWords.length > 2) {
      for (let w = 1; w < cleanWords.length - 1; w++) {
        const midWord = cleanWords[w]
        for (let i = 0; i < midWord.length; i++) {
          for (let j = i + 1; j < midWord.length; j++) {
            addCandidate(p1 + midWord[i] + midWord[j])
          }
        }
      }
    }

    // 4. Novas combinações da 1ª palavra combinadas com a última
    for (let i = 0; i < firstWord.length; i++) {
      for (let j = i + 1; j < firstWord.length; j++) {
        const altP1 = firstWord[i] + firstWord[j]
        for (let k = 0; k < lastWord.length; k++) {
          for (let l = k + 1; l < lastWord.length; l++) {
            addCandidate(altP1 + lastWord[k] + lastWord[l])
          }
        }
      }
    }
  }

  // 5. Permutações alfabéticas puras (A-Z) sem números
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const p1 = cleanWords[0]?.slice(0, 2).padEnd(2, 'X') || 'XX'

  // Mantém p1 e testa sufixos AA..ZZ
  for (let i = 0; i < letters.length; i++) {
    for (let j = 0; j < letters.length; j++) {
      addCandidate(p1 + letters[i] + letters[j])
    }
  }

  // Testa combinações completas AAAA..ZZZZ
  for (let i = 0; i < letters.length; i++) {
    for (let j = 0; j < letters.length; j++) {
      for (let k = 0; k < letters.length; k++) {
        for (let l = 0; l < letters.length; l++) {
          addCandidate(letters[i] + letters[j] + letters[k] + letters[l])
        }
      }
    }
  }

  return candidates
}
