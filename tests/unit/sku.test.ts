import { describe, it, expect } from 'vitest'
import { generateTecidoSku, normalizeUnaccent } from '../../src/shared/sku'

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
