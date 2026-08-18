import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CoresService, formatHex, validateCorFields } from '../../src/main/services/cores.service'
import { labToHex, hexToLab, isValidHex, formatHexInput } from '../../src/renderer/features/cores/utils'
import { normalizeUnaccent } from '../../src/shared/sku'

type MockCorRow = {
  id: string
  nome: string
  hex: string
  lab: string
  created_at: string
  updated_at: string
}

let mockCores: MockCorRow[] = []

function resetMockDb() {
  const now = new Date().toISOString()
  mockCores = [
    {
      id: '1',
      nome: 'Preto Absoluto',
      hex: '#000000',
      lab: '00,00 / 00,00 / 00,00',
      created_at: now,
      updated_at: now
    },
    {
      id: '2',
      nome: 'Branco Puro',
      hex: '#FFFFFF',
      lab: '100,00 / 00,00 / 00,00',
      created_at: now,
      updated_at: now
    },
    {
      id: '3',
      nome: 'Amarelo Canário',
      hex: '#FFCC00',
      lab: '83,25 / 08,12 / 85,34',
      created_at: now,
      updated_at: now
    },
    {
      id: '4',
      nome: 'Azul Marinho',
      hex: '#002244',
      lab: '14,28 / 05,42 / -28,91',
      created_at: now,
      updated_at: now
    },
    {
      id: '5',
      nome: 'Vermelho Carmim',
      hex: '#D62246',
      lab: '45,82 / 69,14 / 27,51',
      created_at: now,
      updated_at: now
    },
    {
      id: '6',
      nome: 'Verde Militar',
      hex: '#4B5320',
      lab: '34,12 / -12,45 / 26,80',
      created_at: now,
      updated_at: now
    }
  ]
}

vi.mock('../../src/main/database/db', () => {
  return {
    getDb: () => ({
      prepare: (sql: string) => {
        const cleanSql = sql.replace(/\s+/g, ' ').trim()

        if (cleanSql.includes('SELECT * FROM cores WHERE unaccent(nome) LIKE ?')) {
          return {
            all: (term: string) => {
              const cleanTerm = term.replace(/%/g, '').toLowerCase()
              return mockCores
                .filter((r) => {
                  const n = normalizeUnaccent(r.nome)
                  const h = normalizeUnaccent(r.hex)
                  const l = normalizeUnaccent(r.lab)
                  return n.includes(cleanTerm) || h.includes(cleanTerm) || l.includes(cleanTerm)
                })
                .sort((a, b) => a.nome.localeCompare(b.nome, undefined, { sensitivity: 'base' }))
            }
          }
        }

        if (cleanSql.includes('SELECT * FROM cores ORDER BY nome COLLATE NOCASE ASC')) {
          return {
            all: () => {
              return [...mockCores].sort((a, b) =>
                a.nome.localeCompare(b.nome, undefined, { sensitivity: 'base' })
              )
            }
          }
        }

        if (cleanSql.includes('SELECT * FROM cores WHERE id = ?')) {
          return {
            get: (id: string) => mockCores.find((r) => r.id === id)
          }
        }

        if (cleanSql.includes('INSERT INTO cores')) {
          return {
            run: (
              id: string,
              nome: string,
              hex: string,
              lab: string,
              createdAt: string,
              updatedAt: string
            ) => {
              mockCores.push({
                id,
                nome,
                hex,
                lab,
                created_at: createdAt,
                updated_at: updatedAt
              })
              return { changes: 1 }
            }
          }
        }

        if (cleanSql.includes('UPDATE cores SET')) {
          return {
            run: (
              nome: string,
              hex: string,
              lab: string,
              updatedAt: string,
              id: string
            ) => {
              const idx = mockCores.findIndex((r) => r.id === id)
              if (idx !== -1) {
                mockCores[idx] = {
                  ...mockCores[idx],
                  nome,
                  hex,
                  lab,
                  updated_at: updatedAt
                }
                return { changes: 1 }
              }
              return { changes: 0 }
            }
          }
        }

        if (cleanSql.includes('DELETE FROM cores WHERE id = ?')) {
          return {
            run: (id: string) => {
              const prev = mockCores.length
              mockCores = mockCores.filter((r) => r.id !== id)
              return { changes: prev - mockCores.length }
            }
          }
        }

        throw new Error(`Unhandled mock query: ${cleanSql}`)
      }
    })
  }
})

describe('CoresService (SQLite Domain Operations)', () => {
  beforeEach(() => {
    resetMockDb()
  })

  it('should list initial seeded colors sorted alphabetically by name', () => {
    const list = CoresService.list()
    expect(list.length).toBe(6)

    const names = list.map((c) => c.nome.toLowerCase())
    const sorted = [...names].sort((a, b) => a.localeCompare(b))
    expect(names).toEqual(sorted)
  })

  it('should filter colors by unaccented query, hex, or lab', () => {
    // Busca sem acento
    const resultsCanario = CoresService.list('canario')
    expect(resultsCanario.length).toBe(1)
    expect(resultsCanario[0].nome).toBe('Amarelo Canário')

    // Busca por HEX
    const resultsHex = CoresService.list('FFCC00')
    expect(resultsHex.length).toBe(1)
    expect(resultsHex[0].hex).toBe('#FFCC00')
  })

  it('should retrieve a color by id', () => {
    const color = CoresService.getById('3')
    expect(color).not.toBeNull()
    expect(color?.nome).toBe('Amarelo Canário')
    expect(color?.hex).toBe('#FFCC00')
  })

  it('should create a new color and format hex to uppercase with #', () => {
    const created = CoresService.create({
      nome: 'Rosa Choque',
      hex: 'ff007f',
      lab: '53,24 / 80,11 / 10,45'
    })

    expect(created.id).toBeDefined()
    expect(created.nome).toBe('Rosa Choque')
    expect(created.hex).toBe('#FF007F')
    expect(created.lab).toBe('53,24 / 80,11 / 10,45')

    const fetched = CoresService.getById(created.id)
    expect(fetched).not.toBeNull()
    expect(fetched?.hex).toBe('#FF007F')
  })

  it('should validate required fields and hex regex on create', () => {
    expect(() => {
      CoresService.create({
        nome: '',
        hex: '#FFCC00',
        lab: '00,00 / 00,00 / 00,00'
      })
    }).toThrow(/nome.*obrigat/i)

    expect(() => {
      CoresService.create({
        nome: 'Cor Invalida',
        hex: '#INVALID',
        lab: '00,00 / 00,00 / 00,00'
      })
    }).toThrow(/hex/i)

    expect(() => {
      CoresService.create({
        nome: 'Cor Sem LAB',
        hex: '#FF0000',
        lab: ''
      })
    }).toThrow(/lab/i)
  })

  it('should update an existing color', () => {
    const updated = CoresService.update('3', {
      nome: 'Amarelo Ouro',
      hex: '#FFD700'
    })

    expect(updated.nome).toBe('Amarelo Ouro')
    expect(updated.hex).toBe('#FFD700')
    expect(updated.lab).toBe('83,25 / 08,12 / 85,34')
  })

  it('should delete an existing color by id', () => {
    const deleted = CoresService.delete('1')
    expect(deleted).toBe(true)

    const after = CoresService.getById('1')
    expect(after).toBeNull()
  })
})

describe('Color Converters & Formatters (utils.ts)', () => {
  it('should format hex input to uppercase #RRGGBB', () => {
    expect(formatHexInput('ffcc00')).toBe('#FFCC00')
    expect(formatHexInput('#abc1234')).toBe('#ABC123')
    expect(isValidHex('#FFCC00')).toBe(true)
    expect(isValidHex('#123')).toBe(false)
  })

  it('should convert LAB to approximate HEX', () => {
    // Preto: L=0, a=0, b=0 -> #000000
    const blackHex = labToHex('00,00 / 00,00 / 00,00')
    expect(blackHex).toBe('#000000')

    // Branco: L=100, a=0, b=0 -> #FFFFFF
    const whiteHex = labToHex('100,00 / 00,00 / 00,00')
    expect(whiteHex).toBe('#FFFFFF')

    // Cor arbitrária
    const yellowHex = labToHex('83,25 / 08,12 / 85,34')
    expect(yellowHex).toMatch(/^#[0-9A-F]{6}$/)
  })

  it('should convert HEX to LAB format', () => {
    const labBlack = hexToLab('#000000')
    expect(labBlack).toContain('00,00 / 00,00 / 00,00')

    const labWhite = hexToLab('#FFFFFF')
    expect(labWhite).toContain('100,00')
  })
})
