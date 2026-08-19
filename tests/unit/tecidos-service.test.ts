import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TecidosService } from '../../src/main/services/tecidos.service'
import { normalizeUnaccent } from '../../src/shared/sku'

// Mock in-memory data store for Tecidos database operations
type MockTecidoRow = {
  id: string
  codigo: string
  nome: string
  composicao: string
  largura: number
  rendimento: number | null
  gramatura_linear: number | null
  gramatura_m2: number | null
  tipo: string | null
  transparencia: string | null
  elasticidade: string | null
  acabamento: string | null
  created_at: string
  updated_at: string
}

let mockTecidos: MockTecidoRow[] = []

function resetMockDb() {
  const now = new Date().toISOString()
  mockTecidos = [
    {
      id: '1',
      codigo: 'TRAL',
      nome: 'Tricoline Lisa 100% Algodão',
      composicao: '100% Algodão',
      largura: 1.50,
      rendimento: 5.50,
      gramatura_linear: 180,
      gramatura_m2: 120,
      tipo: 'liso',
      transparencia: 'nenhuma',
      elasticidade: 'nenhuma',
      acabamento: 'fosco',
      created_at: now,
      updated_at: now
    },
    {
      id: '2',
      codigo: 'CETI',
      nome: 'Cetim',
      composicao: '100% Poliéster',
      largura: 1.50,
      rendimento: 6.50,
      gramatura_linear: 150,
      gramatura_m2: 100,
      tipo: 'liso',
      transparencia: 'nenhuma',
      elasticidade: 'nenhuma',
      acabamento: 'brilhante',
      created_at: now,
      updated_at: now
    },
    {
      id: '3',
      codigo: 'CEEL',
      nome: 'Cetim com Elastano',
      composicao: '97% Poliéster / 3% Elastano',
      largura: 1.45,
      rendimento: 5.00,
      gramatura_linear: 200,
      gramatura_m2: 140,
      tipo: 'liso',
      transparencia: 'nenhuma',
      elasticidade: 'baixa',
      acabamento: 'semi_brilho',
      created_at: now,
      updated_at: now
    },
    {
      id: '4',
      codigo: 'ANAR',
      nome: 'Anarruga',
      composicao: '100% Algodão',
      largura: 1.40,
      rendimento: 4.50,
      gramatura_linear: 220,
      gramatura_m2: 160,
      tipo: 'estampado',
      transparencia: 'baixa',
      elasticidade: 'nenhuma',
      acabamento: 'fosco',
      created_at: now,
      updated_at: now
    },
    {
      id: '5',
      codigo: 'LIRU',
      nome: 'Linho Puro Rústico',
      composicao: '100% Linho',
      largura: 1.45,
      rendimento: 3.00,
      gramatura_linear: 350,
      gramatura_m2: 240,
      tipo: 'liso',
      transparencia: 'baixa',
      elasticidade: 'nenhuma',
      acabamento: 'fosco',
      created_at: now,
      updated_at: now
    },
    {
      id: '6',
      codigo: 'SAEL',
      nome: 'Sarja Acetinada com Elastano',
      composicao: '97% Algodão / 3% Elastano',
      largura: 1.60,
      rendimento: 2.50,
      gramatura_linear: 420,
      gramatura_m2: 260,
      tipo: 'liso',
      transparencia: 'nenhuma',
      elasticidade: 'baixa',
      acabamento: 'semi_brilho',
      created_at: now,
      updated_at: now
    },
    {
      id: '7',
      codigo: 'VISA',
      nome: 'Viscose Sarjada',
      composicao: '100% Viscose',
      largura: 1.48,
      rendimento: 4.00,
      gramatura_linear: 240,
      gramatura_m2: 170,
      tipo: 'liso',
      transparencia: 'baixa',
      elasticidade: 'nenhuma',
      acabamento: 'fosco',
      created_at: now,
      updated_at: now
    },
    {
      id: '8',
      codigo: 'JEPE',
      nome: 'Jeans Denim Pesado',
      composicao: '98% Algodão / 2% Elastano',
      largura: 1.65,
      rendimento: 1.50,
      gramatura_linear: 630,
      gramatura_m2: 380,
      tipo: 'liso',
      transparencia: 'nenhuma',
      elasticidade: 'baixa',
      acabamento: 'fosco',
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

        if (cleanSql.includes('SELECT * FROM tecidos WHERE unaccent(codigo) LIKE ?')) {
          return {
            all: (term: string) => {
              const cleanTerm = term.replace(/%/g, '').toLowerCase()
              return mockTecidos
                .filter((r) => {
                  const c = normalizeUnaccent(r.codigo)
                  const n = normalizeUnaccent(r.nome)
                  const cp = normalizeUnaccent(r.composicao)
                  const tp = normalizeUnaccent(r.tipo || '')
                  const ac = normalizeUnaccent(r.acabamento || '')
                  return (
                    c.includes(cleanTerm) ||
                    n.includes(cleanTerm) ||
                    cp.includes(cleanTerm) ||
                    tp.includes(cleanTerm) ||
                    ac.includes(cleanTerm)
                  )
                })
                .sort((a, b) => a.nome.localeCompare(b.nome, undefined, { sensitivity: 'base' }))
            }
          }
        }

        if (cleanSql.includes('SELECT * FROM tecidos ORDER BY nome COLLATE NOCASE ASC')) {
          return {
            all: () => {
              return [...mockTecidos].sort((a, b) =>
                a.nome.localeCompare(b.nome, undefined, { sensitivity: 'base' })
              )
            }
          }
        }

        if (cleanSql.includes('SELECT * FROM tecidos WHERE id = ?')) {
          return {
            get: (id: string) => mockTecidos.find((r) => r.id === id)
          }
        }

        if (cleanSql.includes('SELECT id, codigo FROM tecidos WHERE codigo = ?')) {
          return {
            get: (codigo: string) => mockTecidos.find((r) => r.codigo === codigo)
          }
        }

        if (cleanSql.includes('SELECT id FROM tecidos WHERE codigo = ?')) {
          return {
            get: (codigo: string) => mockTecidos.find((r) => r.codigo === codigo)
          }
        }

        if (cleanSql.includes('INSERT INTO tecidos')) {
          return {
            run: (
              id: string,
              codigo: string,
              nome: string,
              composicao: string,
              largura: number,
              rendimento: number | null,
              gramaturaLinear: number | null,
              gramaturaM2: number | null,
              tipo: string | null,
              transparencia: string | null,
              elasticidade: string | null,
              acabamento: string | null,
              createdAt: string,
              updatedAt: string
            ) => {
              mockTecidos.push({
                id,
                codigo,
                nome,
                composicao,
                largura,
                rendimento,
                gramatura_linear: gramaturaLinear,
                gramatura_m2: gramaturaM2,
                tipo,
                transparencia,
                elasticidade,
                acabamento,
                created_at: createdAt,
                updated_at: updatedAt
              })
              return { changes: 1 }
            }
          }
        }

        if (cleanSql.includes('UPDATE tecidos SET')) {
          return {
            run: (
              codigo: string,
              nome: string,
              composicao: string,
              largura: number,
              rendimento: number | null,
              gramaturaLinear: number | null,
              gramaturaM2: number | null,
              tipo: string | null,
              transparencia: string | null,
              elasticidade: string | null,
              acabamento: string | null,
              updatedAt: string,
              id: string
            ) => {
              const idx = mockTecidos.findIndex((r) => r.id === id)
              if (idx !== -1) {
                mockTecidos[idx] = {
                  ...mockTecidos[idx],
                  codigo,
                  nome,
                  composicao,
                  largura,
                  rendimento,
                  gramatura_linear: gramaturaLinear,
                  gramatura_m2: gramaturaM2,
                  tipo,
                  transparencia,
                  elasticidade,
                  acabamento,
                  updated_at: updatedAt
                }
                return { changes: 1 }
              }
              return { changes: 0 }
            }
          }
        }

        if (cleanSql.includes('DELETE FROM tecidos WHERE id = ?')) {
          return {
            run: (id: string) => {
              const prev = mockTecidos.length
              mockTecidos = mockTecidos.filter((r) => r.id !== id)
              return { changes: prev - mockTecidos.length }
            }
          }
        }

        throw new Error(`Unhandled mock query: ${cleanSql}`)
      }
    })
  }
})

describe('TecidosService (SQLite Domain Operations)', () => {
  beforeEach(() => {
    resetMockDb()
  })

  it('should list initial seeded fabrics sorted alphabetically by name', () => {
    const list = TecidosService.list()
    expect(list.length).toBe(8)

    // Verifica ordenação alfabética
    const names = list.map((t) => t.nome.toLowerCase())
    const sorted = [...names].sort((a, b) => a.localeCompare(b))
    expect(names).toEqual(sorted)
  })

  it('should filter fabrics by search query with unaccented support', () => {
    // Busca por "algodao" sem acento deve encontrar itens com "Algodão"
    const algodaoResults = TecidosService.list('algodao')
    expect(algodaoResults.length).toBeGreaterThan(0)
    expect(algodaoResults.some((t) => t.nome.includes('Algodão') || t.composicao.includes('Algodão'))).toBe(true)

    // Busca por SKU
    const skuResults = TecidosService.list('TRAL')
    expect(skuResults.length).toBe(1)
    expect(skuResults[0].codigo).toBe('TRAL')
    expect(skuResults[0].nome).toBe('Tricoline Lisa 100% Algodão')
  })

  it('should retrieve a fabric by id', () => {
    const list = TecidosService.list()
    const first = list[0]
    const fetched = TecidosService.getById(first.id)
    expect(fetched).not.toBeNull()
    expect(fetched?.id).toBe(first.id)
    expect(fetched?.codigo).toBe(first.codigo)
  })

  it('should create a new fabric and generate deterministic 4-character SKU', () => {
    const created = TecidosService.create({
      nome: 'Chiffon Toque de Seda',
      composicao: '100% Poliéster',
      largura: 1.50,
      rendimento: 10.00,
      gramaturaLinear: 100,
      gramaturaM2: 67,
      tipo: 'liso',
      transparencia: 'alta',
      elasticidade: 'nenhuma',
      acabamento: 'fosco'
    })

    expect(created.id).toBeDefined()
    expect(created.codigo).toBe('CHSE') // Chiffon (CH) + Seda (SE)
    expect(created.nome).toBe('Chiffon Toque de Seda')
    expect(created.largura).toBe(1.50)
    expect(created.rendimento).toBe(10.00)

    const found = TecidosService.getById(created.id)
    expect(found).not.toBeNull()
    expect(found?.codigo).toBe('CHSE')
  })

  it('should handle SKU collision deterministically with 4 pure letters (no numbers)', () => {
    const t1 = TecidosService.create({
      nome: 'Tule Renda Alencon', // TU + AL -> TUAL
      composicao: '100% Poliamida',
      largura: 1.40,
      rendimento: 8.00
    })
    expect(t1.codigo).toBe('TUAL')

    const t2 = TecidosService.create({
      nome: 'Tule Rústico Algodão', // TU + AL -> colisão -> TUAG (letras de Algodão)
      composicao: '100% Algodão',
      largura: 1.40,
      rendimento: 7.50
    })

    expect(t2.codigo).toBe('TUAG')
    expect(t2.codigo.length).toBe(4)
    expect(t2.codigo).not.toBe(t1.codigo)
    expect(t2.codigo).toMatch(/^[A-Z]{4}$/)
  })

  it('should validate required fields on create', () => {
    expect(() => {
      TecidosService.create({
        nome: '',
        composicao: '100% Algodão',
        largura: 1.50,
        rendimento: 5.0
      })
    }).toThrow(/nome.*obrigat/i)

    expect(() => {
      TecidosService.create({
        nome: 'Tecido Teste',
        composicao: '',
        largura: 1.50,
        rendimento: 5.0
      })
    }).toThrow(/composicao.*obrigat/i)

    expect(() => {
      TecidosService.create({
        nome: 'Tecido Teste',
        composicao: '100% Algodão',
        largura: 0,
        rendimento: 5.0
      })
    }).toThrow(/largura.*obrigat/i)

    expect(() => {
      TecidosService.create({
        nome: 'Tecido Teste',
        composicao: '100% Algodão',
        largura: 1.50
      })
    }).toThrow(/métrica secundária/i)
  })

  it('should update an existing fabric and update SKU if name changes', () => {
    const created = TecidosService.create({
      nome: 'Crepe Moss',
      composicao: '100% Poliéster',
      largura: 1.50,
      rendimento: 4.50
    })
    expect(created.codigo).toBe('CRMO')

    const updated = TecidosService.update(created.id, {
      nome: 'Crepe Georgette Fino',
      largura: 1.45
    })

    expect(updated.codigo).toBe('CRFI') // Crepe (CR) + Fino (FI)
    expect(updated.largura).toBe(1.45)
    expect(updated.composicao).toBe('100% Poliéster')
  })

  it('should delete an existing fabric by id', () => {
    const created = TecidosService.create({
      nome: 'Tecido Para Deletar',
      composicao: '100% Algodão',
      largura: 1.50,
      rendimento: 3.00
    })

    const deleteSuccess = TecidosService.delete(created.id)
    expect(deleteSuccess).toBe(true)

    const afterDelete = TecidosService.getById(created.id)
    expect(afterDelete).toBeNull()
  })
})
