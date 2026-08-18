import { describe, it, expect } from 'vitest'
import {
  parsePtBrNumber,
  roundGramatura,
  roundRendimento,
  formatPtBrNumber,
  calculateMetricsFromRendimento,
  calculateMetricsFromGramaturaLinear,
  calculateMetricsFromGramaturaM2
} from '../../src/shared/textile-math'

describe('Textile Math Utilities', () => {
  describe('parsePtBrNumber', () => {
    it('should parse Brazilian formatted numbers with commas', () => {
      expect(parsePtBrNumber('1,50')).toBe(1.5)
      expect(parsePtBrNumber(' 2,80 ')).toBe(2.8)
      expect(parsePtBrNumber('120,75')).toBe(120.75)
    })

    it('should parse numbers with dots and raw numbers', () => {
      expect(parsePtBrNumber('1.50')).toBe(1.5)
      expect(parsePtBrNumber(2.8)).toBe(2.8)
      expect(parsePtBrNumber(180)).toBe(180)
    })

    it('should return null for invalid, empty, or non-positive values', () => {
      expect(parsePtBrNumber('')).toBeNull()
      expect(parsePtBrNumber('  ')).toBeNull()
      expect(parsePtBrNumber(null)).toBeNull()
      expect(parsePtBrNumber(undefined)).toBeNull()
      expect(parsePtBrNumber('abc')).toBeNull()
      expect(parsePtBrNumber('0')).toBeNull()
      expect(parsePtBrNumber('-5')).toBeNull()
      expect(parsePtBrNumber(-10)).toBeNull()
    })
  })

  describe('roundGramatura', () => {
    it('should round to the nearest decade (10)', () => {
      expect(roundGramatura(273)).toBe(270)
      expect(roundGramatura(276)).toBe(280)
      expect(roundGramatura(181.81)).toBe(180)
      expect(roundGramatura(121.21)).toBe(120)
      expect(roundGramatura(137.93)).toBe(140)
      expect(roundGramatura(241.38)).toBe(240)
    })

    it('should handle zero and negative numbers', () => {
      expect(roundGramatura(0)).toBe(0)
      expect(roundGramatura(-10)).toBe(0)
    })
  })

  describe('roundRendimento', () => {
    it('should round to the nearest 0.5 interval', () => {
      expect(roundRendimento(5.48)).toBe(5.5)
      expect(roundRendimento(5.24)).toBe(5.0)
      expect(roundRendimento(5.26)).toBe(5.5)
      expect(roundRendimento(2.857)).toBe(3.0)
      expect(roundRendimento(2.38)).toBe(2.5)
      expect(roundRendimento(6.49)).toBe(6.5)
    })

    it('should handle zero and negative numbers', () => {
      expect(roundRendimento(0)).toBe(0)
      expect(roundRendimento(-2)).toBe(0)
    })
  })

  describe('formatPtBrNumber', () => {
    it('should format numbers with comma separator', () => {
      expect(formatPtBrNumber(1.5)).toBe('1,5')
      expect(formatPtBrNumber(1.5, 2)).toBe('1,50')
      expect(formatPtBrNumber(2.8, 2)).toBe('2,80')
      expect(formatPtBrNumber(180)).toBe('180')
    })

    it('should handle null, undefined, or NaN gracefully', () => {
      expect(formatPtBrNumber(null)).toBe('')
      expect(formatPtBrNumber(undefined)).toBe('')
      expect(formatPtBrNumber(NaN)).toBe('')
    })
  })

  describe('Engineering Formula Calculations', () => {
    describe('calculateMetricsFromRendimento (L + R)', () => {
      it('should calculate GL = 1000/R and GM = GL/L accurately (Tricoline)', () => {
        // Tricoline: L=1.50, R=5.50 -> GL = 1000/5.5 = 181.81 -> 180, GM = 181.81/1.5 = 121.21 -> 120
        const result = calculateMetricsFromRendimento(1.50, 5.50)
        expect(result.gramaturaLinear).toBe(180)
        expect(result.gramaturaM2).toBe(120)
        expect(result.rendimento).toBe(5.50)
      })

      it('should calculate Cetim com Elastano (L=1.45, R=5.00)', () => {
        // GL = 1000/5 = 200, GM = 200/1.45 = 137.93 -> 140
        const result = calculateMetricsFromRendimento(1.45, 5.00)
        expect(result.gramaturaLinear).toBe(200)
        expect(result.gramaturaM2).toBe(140)
        expect(result.rendimento).toBe(5.00)
      })

      it('should throw error on invalid inputs', () => {
        expect(() => calculateMetricsFromRendimento(0, 5.0)).toThrow()
        expect(() => calculateMetricsFromRendimento(1.5, 0)).toThrow()
      })
    })

    describe('calculateMetricsFromGramaturaLinear (L + GL)', () => {
      it('should calculate R = 1000/GL and GM = GL/L accurately (Linho Puro)', () => {
        // Linho: L=1.45, GL=350 -> R = 1000/350 = 2.857 -> 3.00, GM = 350/1.45 = 241.37 -> 240
        const result = calculateMetricsFromGramaturaLinear(1.45, 350)
        expect(result.rendimento).toBe(3.00)
        expect(result.gramaturaM2).toBe(240)
        expect(result.gramaturaLinear).toBe(350)
      })

      it('should throw error on invalid inputs', () => {
        expect(() => calculateMetricsFromGramaturaLinear(-1, 200)).toThrow()
        expect(() => calculateMetricsFromGramaturaLinear(1.5, -200)).toThrow()
      })
    })

    describe('calculateMetricsFromGramaturaM2 (L + GM)', () => {
      it('should calculate GL = GM*L and R = 1000/GL accurately (Sarja Acetinada)', () => {
        // Sarja: L=1.60, GM=260 -> GL = 260*1.60 = 416 -> 420, R = 1000/416 = 2.403 -> 2.50
        const result = calculateMetricsFromGramaturaM2(1.60, 260)
        expect(result.gramaturaLinear).toBe(420)
        expect(result.rendimento).toBe(2.50)
        expect(result.gramaturaM2).toBe(260)
      })

      it('should throw error on invalid inputs', () => {
        expect(() => calculateMetricsFromGramaturaM2(0, 260)).toThrow()
        expect(() => calculateMetricsFromGramaturaM2(1.5, 0)).toThrow()
      })
    })
  })
})
