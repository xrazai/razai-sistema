import { describe, it, expect, beforeEach, vi } from 'vitest'
import { VinculosService } from '../../src/main/services/vinculos.service'
import { normalizeUnaccent } from '../../src/shared/sku'

type MockTecido = {
  id: string
  codigo: string
  nome: string
}

type MockCor = {
  id: string
  codigo: string
  nome: string
  hex: string
  lab: string
}

type MockVinculo = {
  id: string
  tecido_id: string
  cor_id: string
  sku: string
  created_at: string
  updated_at: string
}

let mockTecidos: MockTecido[] = []
let mockCores: MockCor[] = []
let mockVinculos: MockVinculo[] = []

function resetMockDb() {
  const now = new Date().toISOString()
  mockTecidos = [
    { id: 't1', codigo: 'TRAL', nome: 'Tricoline Lisa 100% Algodão' },
    { id: 't2', codigo: 'LIRU', nome: 'Linho Puro Rústico' }
  ]
  mockCores = [
    { id: 'c1', codigo: 'PRETABSO', nome: 'Preto Absoluto', hex: '#000000', lab: '00,00 / 00,00 / 00,00' },
    { id: 'c2', codigo: 'BRANPURO', nome: 'Branco Puro', hex: '#FFFFFF', lab: '100,00 / 00,00 / 00,00' },
    { id: 'c3', codigo: 'AZULMARI', nome: 'Azul Marinho', hex: '#002244', lab: '14,28 / 05,42 / -28,91' }
  ]
  mockVinculos = [
    { id: 'v1', tecido_id: 't1', cor_id: 'c1', sku: 'TRAL-PRETABSO', created_at: now, updated_at: now },
    { id: 'v2', tecido_id: 't1', cor_id: 'c2', sku: 'TRAL-BRANPURO', created_at: now, updated_at: now }
  ]
}

function getJoinedRows() {
  return mockVinculos.map((v) => {
    const t = mockTecidos.find((tec) => tec.id === v.tecido_id) || { nome: '', codigo: '' }
    const c = mockCores.find((cor) => cor.id === v.cor_id) || { nome: '', codigo: '', hex: '', lab: '' }
    return {
      id: v.id,
      tecido_id: v.tecido_id,
      cor_id: v.cor_id,
      sku: v.sku,
      created_at: v.created_at,
      updated_at: v.updated_at,
      tecido_nome: t.nome,
      tecido_codigo: t.codigo,
      cor_nome: c.nome,
      cor_codigo: c.codigo,
      cor_hex: c.hex,
      cor_lab: c.lab
    }
  })
}

vi.mock('../../src/main/database/db', () => {
  return {
    getDb: () => ({
      transaction: (fn: () => void) => () => fn(),
      prepare: (sql: string) => {
        const cleanSql = sql.replace(/\s+/g, ' ').trim()

        if (cleanSql.includes('SELECT id, codigo, nome FROM tecidos WHERE id = ?')) {
          return {
            get: (id: string) => mockTecidos.find((t) => t.id === id)
          }
        }

        if (cleanSql.includes('SELECT id, codigo, nome FROM cores WHERE id = ?')) {
          return {
            get: (id: string) => mockCores.find((c) => c.id === id)
          }
        }

        if (cleanSql.includes('SELECT id FROM vinculos WHERE CAST(tecido_id AS TEXT) = ? AND CAST(cor_id AS TEXT) = ?')) {
          return {
            get: (tId: string, cId: string) =>
              mockVinculos.find((v) => String(v.tecido_id) === String(tId) && String(v.cor_id) === String(cId))
          }
        }

        if (cleanSql.includes('SELECT') && cleanSql.includes('FROM vinculos v') && cleanSql.includes('WHERE v.id = ?')) {
          return {
            get: (id: string) => getJoinedRows().find((r) => r.id === id)
          }
        }

        if (cleanSql.includes('SELECT') && cleanSql.includes('FROM vinculos v') && cleanSql.includes('WHERE v.tecido_id = ?')) {
          return {
            all: (tId: string) => getJoinedRows().filter((r) => r.tecido_id === tId)
          }
        }

        if (cleanSql.includes('SELECT') && cleanSql.includes('WHERE unaccent(v.sku) LIKE ?')) {
          return {
            all: (term: string) => {
              const clean = term.replace(/%/g, '').toLowerCase()
              return getJoinedRows().filter((r) => {
                const s = normalizeUnaccent(r.sku)
                const tn = normalizeUnaccent(r.tecido_nome)
                const tc = normalizeUnaccent(r.tecido_codigo)
                const cn = normalizeUnaccent(r.cor_nome)
                const cc = normalizeUnaccent(r.cor_codigo)
                const ch = normalizeUnaccent(r.cor_hex)
                return (
                  s.includes(clean) ||
                  tn.includes(clean) ||
                  tc.includes(clean) ||
                  cn.includes(clean) ||
                  cc.includes(clean) ||
                  ch.includes(clean)
                )
              })
            }
          }
        }

        if (cleanSql.includes('SELECT') && cleanSql.includes('FROM vinculos v')) {
          return {
            all: () => getJoinedRows()
          }
        }

        if (cleanSql.includes('INSERT') && cleanSql.includes('INTO vinculos')) {
          return {
            run: (
              id: string,
              tecidoId: string,
              corId: string,
              sku: string,
              createdAt: string,
              updatedAt: string
            ) => {
              mockVinculos.push({
                id,
                tecido_id: tecidoId,
                cor_id: corId,
                sku,
                created_at: createdAt,
                updated_at: updatedAt
              })
              return { changes: 1 }
            }
          }
        }

        if (cleanSql.includes('DELETE FROM vinculos WHERE tecido_id = ? AND cor_id = ?')) {
          return {
            run: (tId: string, cId: string) => {
              const prev = mockVinculos.length
              mockVinculos = mockVinculos.filter((v) => !(v.tecido_id === tId && v.cor_id === cId))
              return { changes: prev - mockVinculos.length }
            }
          }
        }

        if (cleanSql.includes('DELETE FROM vinculos WHERE id = ?')) {
          return {
            run: (id: string) => {
              const prev = mockVinculos.length
              mockVinculos = mockVinculos.filter((v) => v.id !== id)
              return { changes: prev - mockVinculos.length }
            }
          }
        }

        throw new Error(`Unhandled mock query: ${cleanSql}`)
      }
    })
  }
})

describe('VinculosService', () => {
  beforeEach(() => {
    resetMockDb()
  })

  it('should list all initial vinculos with joined fabric and color data', () => {
    const list = VinculosService.list()
    expect(list.length).toBe(2)
    expect(list[0].sku).toBe('TRAL-PRETABSO')
    expect(list[0].tecidoNome).toBe('Tricoline Lisa 100% Algodão')
    expect(list[0].corNome).toBe('Preto Absoluto')
    expect(list[0].corHex).toBe('#000000')
  })

  it('should filter vinculos by search term', () => {
    const filtered = VinculosService.list('PRETABSO')
    expect(filtered.length).toBe(1)
    expect(filtered[0].sku).toBe('TRAL-PRETABSO')
  })

  it('should list vinculos by tecidoId', () => {
    const byTecido = VinculosService.listByTecido('t1')
    expect(byTecido.length).toBe(2)
    expect(byTecido.every((v) => v.tecidoId === 't1')).toBe(true)
  })

  it('should create batch vinculos and generate composite SKUs', () => {
    const created = VinculosService.createBatch({
      tecidoId: 't1',
      corIds: ['c3'] // Azul Marinho
    })

    expect(created.length).toBe(1)
    expect(created[0].sku).toBe('TRAL-AZULMARI')
    expect(created[0].corNome).toBe('Azul Marinho')

    const updatedList = VinculosService.listByTecido('t1')
    expect(updatedList.length).toBe(3)
  })

  it('should not duplicate already existing vinculos in batch creation', () => {
    const res = VinculosService.createBatch({
      tecidoId: 't1',
      corIds: ['c1', 'c3'] // c1 already linked
    })

    expect(res.length).toBe(2)
    const list = VinculosService.listByTecido('t1')
    expect(list.length).toBe(3) // started with 2, only c3 added
  })

  it('should delete a vinculo by id', () => {
    const deleted = VinculosService.delete('v1')
    expect(deleted).toBe(true)

    const list = VinculosService.list()
    expect(list.length).toBe(1)
  })

  it('should delete a vinculo by tecidoId and corId', () => {
    const deleted = VinculosService.deleteByTecidoAndCor('t1', 'c2')
    expect(deleted).toBe(true)

    const list = VinculosService.listByTecido('t1')
    expect(list.length).toBe(1)
    expect(list[0].sku).toBe('TRAL-PRETABSO')
  })
})
