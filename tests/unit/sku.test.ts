import { describe, it, expect } from 'vitest'
import {
  generateTecidoSku,
  getTecidoSkuCandidates,
  generateCorSku,
  getCorSkuCandidates,
  validateCorNome,
  normalizeUnaccent
} from '../../src/shared/sku'

describe('normalizeUnaccent', () => {
  it('should remove diacritics and convert to lowercase', () => {
    expect(normalizeUnaccent('Algodão')).toBe('algodao')
    expect(normalizeUnaccent('Rústico')).toBe('rustico')
    expect(normalizeUnaccent('Cetim com Elastano')).toBe('cetim com elastano')
    expect(normalizeUnaccent('ÉçãõÍ')).toBe('ecaoi')
  })

  it('should handle empty or null values gracefully', () => {
    expect(normalizeUnaccent('')).toBe('')
    expect(normalizeUnaccent(null)).toBe('')
    expect(normalizeUnaccent(undefined)).toBe('')
  })
})

describe('validateCorNome', () => {
  it('should accept valid 2-word names (family + variation)', () => {
    expect(validateCorNome('Azul Marinho').valid).toBe(true)
    expect(validateCorNome('Verde Militar').valid).toBe(true)
    expect(validateCorNome('Rosa Chá').valid).toBe(true)
    expect(validateCorNome('Preto Absoluto').valid).toBe(true)
    expect(validateCorNome('Amarelo Canário').valid).toBe(true)
  })

  it('should reject names with fewer than 2 words or more than 2 words', () => {
    expect(validateCorNome('Azul').valid).toBe(false)
    expect(validateCorNome('Verde Oliva Escuro').valid).toBe(false)
    expect(validateCorNome('').valid).toBe(false)
    expect(validateCorNome('   ').valid).toBe(false)
  })
})

describe('generateCorSku (Semantic 8-character color SKU)', () => {
  it('should generate 8 chars from family (4) + variation (4)', () => {
    expect(generateCorSku('Azul Marinho')).toBe('AZULMARI')
    expect(generateCorSku('Verde Militar')).toBe('VERDMILI')
    expect(generateCorSku('Preto Absoluto')).toBe('PRETABSO')
    expect(generateCorSku('Branco Puro')).toBe('BRANPURO')
    expect(generateCorSku('Amarelo Canário')).toBe('AMARCANA')
    expect(generateCorSku('Vermelho Carmim')).toBe('VERMCARM')
  })

  it('should pad with X if words have fewer than 4 characters', () => {
    expect(generateCorSku('Rosa Chá')).toBe('ROSACHAX')
    expect(generateCorSku('Cáqui Sol')).toBe('CAQUSOLX')
    expect(generateCorSku('Roxo Pá')).toBe('ROXOPAXX')
    expect(generateCorSku('Pó Dó')).toBe('POXXDOXX')
  })

  it('should remove diacritics cleanly', () => {
    expect(generateCorSku('Laranja Âmbar')).toBe('LARAAMBA')
    expect(generateCorSku('Salmão Açafrao')).toBe('SALMACAF')
  })
})

describe('getCorSkuCandidates (Collision Resolution for Colors)', () => {
  it('should prioritize base SKU first', () => {
    const candidates = getCorSkuCandidates('Verde Militar')
    expect(candidates[0]).toBe('VERDMILI')
  })

  it('should first vary the last 2 letters of variation using word letters', () => {
    const candidates = getCorSkuCandidates('Verde Militar')
    // Base is VERDMILI (VERD + MI + LI). Next candidates should keep VERDMI and pick pairs like LT, LA, TR, etc.
    expect(candidates).toContain('VERDMILT')
    expect(candidates).toContain('VERDMILA')
    expect(candidates).toContain('VERDMIAR')
  })

  it('should vary the first 2 letters of variation if last 2 letter combinations are exhausted', () => {
    const candidates = getCorSkuCandidates('Verde Militar')
    // Alternate prefixes from MILITAR like IL, LI, IT, TA, AR
    expect(candidates.some((c) => c.startsWith('VERDIL'))).toBe(true)
    expect(candidates.some((c) => c.startsWith('VERDLI'))).toBe(true)
  })

  it('should not contain numbers in alphabetical candidate fallbacks', () => {
    const candidates = getCorSkuCandidates('Rosa Chá')
    for (const c of candidates.slice(0, 100)) {
      expect(c).toMatch(/^[A-Z]{8}$/)
    }
  })
})

describe('generateTecidoSku', () => {
  it('should generate 4 chars from single word names', () => {
    expect(generateTecidoSku('Anarruga')).toBe('ANAR')
    expect(generateTecidoSku('Cetim')).toBe('CETI')
    expect(generateTecidoSku('Viscose')).toBe('VISC')
    expect(generateTecidoSku('Twill')).toBe('TWIL')
  })

  it('should generate 4 chars from first and last words in multi-word names', () => {
    expect(generateTecidoSku('Cetim com Elastano')).toBe('CEEL')
    expect(generateTecidoSku('Linho Puro Rústico')).toBe('LIRU')
    expect(generateTecidoSku('Sarja Acetinada com Elastano')).toBe('SAEL')
    expect(generateTecidoSku('Viscose Sarjada')).toBe('VISA')
    expect(generateTecidoSku('Jeans Denim Pesado')).toBe('JEPE')
  })

  it('should ignore purely numeric tokens like percentages when identifying last word', () => {
    // "Tricoline Lisa 100% Algodão" -> first: Tricoline (TR), last: Algodão (AL) -> TRAL
    expect(generateTecidoSku('Tricoline Lisa 100% Algodão')).toBe('TRAL')
    expect(generateTecidoSku('Linho 100%')).toBe('LINH')
  })

  it('should remove diacritics when generating SKU', () => {
    expect(generateTecidoSku('Lã Rústica')).toBe('LARU')
    expect(generateTecidoSku('Açúcar')).toBe('ACUC')
  })

  it('should pad with X if words have fewer than 2 characters or single word has fewer than 4 characters', () => {
    expect(generateTecidoSku('Lã')).toBe('LAXX')
    expect(generateTecidoSku('A B')).toBe('AXBX')
    expect(generateTecidoSku('Fox')).toBe('FOXX')
  })

  it('should return XXXX for empty, whitespace, or invalid names', () => {
    expect(generateTecidoSku('')).toBe('XXXX')
    expect(generateTecidoSku('   ')).toBe('XXXX')
    expect(generateTecidoSku('!@#$%')).toBe('XXXX')
  })
})

describe('getTecidoSkuCandidates (Collision Resolution for Fabrics)', () => {
  it('should prioritize base SKU first', () => {
    const candidates = getTecidoSkuCandidates('Tule Renda Alencon')
    expect(candidates[0]).toBe('TUAL')
  })

  it('should seek new letter combinations starting from the last word (no numbers)', () => {
    const candidates = getTecidoSkuCandidates('Tule Renda Alencon')
    // Alencon letters: A, L, E, N, C, O, N
    // Starting with TU: TUAE, TUAN, TUAC, TUAO, TULE, TULN, etc.
    expect(candidates).toContain('TUAE')
    expect(candidates).toContain('TUAN')
    expect(candidates).toContain('TUAC')
    expect(candidates).toContain('TUAO')
    expect(candidates).toContain('TULE')
  })

  it('should contain only uppercase letters (no numbers)', () => {
    const candidates = getTecidoSkuCandidates('Anarruga')
    for (const c of candidates.slice(0, 100)) {
      expect(c).toMatch(/^[A-Z]{4}$/)
    }
  })
})
