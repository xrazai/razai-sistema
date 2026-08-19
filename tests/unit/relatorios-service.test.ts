import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RelatoriosService } from '../../src/main/services/relatorios.service'

type MockVenda = {
  id: string
  numero: number
  valor_total: number
  quantidade_total: number
  created_at: string
}

type MockVendaItem = {
  id: string
  venda_id: string
  tecido_id: string
  tecido_nome: string
  tecido_codigo: string
  cor_id: string
  cor_nome: string
  cor_codigo: string
  cor_hex: string | null
  quantidade: number
  subtotal: number
  created_at: string
}

let mockVendas: MockVenda[] = []
let mockVendaItens: MockVendaItem[] = []

function resetMockDb() {
  const d1 = new Date()
  const d2 = new Date(d1)
  d2.setDate(d2.getDate() - 1)
  const d3 = new Date(d1)
  d3.setDate(d3.getDate() - 2)

  mockVendas = [
    {
      id: 'v1',
      numero: 1,
      valor_total: 600.0,
      quantidade_total: 12.0,
      created_at: d1.toISOString()
    },
    {
      id: 'v2',
      numero: 2,
      valor_total: 400.0,
      quantidade_total: 8.0,
      created_at: d2.toISOString()
    }
  ]

  mockVendaItens = [
    {
      id: 'vi-1',
      venda_id: 'v1',
      tecido_id: 'tec-1',
      tecido_nome: 'Tricoline',
      tecido_codigo: 'TRAL',
      cor_id: 'cor-1',
      cor_nome: 'Azul',
      cor_codigo: 'AZUL',
      cor_hex: '#0000FF',
      quantidade: 10.0,
      subtotal: 500.0,
      created_at: d1.toISOString()
    },
    {
      id: 'vi-2',
      venda_id: 'v1',
      tecido_id: 'tec-1',
      tecido_nome: 'Tricoline',
      tecido_codigo: 'TRAL',
      cor_id: 'cor-2',
      cor_nome: 'Preto',
      cor_codigo: 'PRET',
      cor_hex: '#000000',
      quantidade: 2.0,
      subtotal: 100.0,
      created_at: d1.toISOString()
    },
    {
      id: 'vi-3',
      venda_id: 'v2',
      tecido_id: 'tec-2',
      tecido_nome: 'Seda',
      tecido_codigo: 'SEDA',
      cor_id: 'cor-3',
      cor_nome: 'Branco',
      cor_codigo: 'BRAN',
      cor_hex: '#FFFFFF',
      quantidade: 8.0,
      subtotal: 400.0,
      created_at: d2.toISOString()
    }
  ]
}

vi.mock('../../src/main/database/db', () => {
  return {
    getDb: () => ({
      prepare: (sql: string) => {
        const cleanSql = sql.replace(/\s+/g, ' ').trim()

        // getKpis query
        if (cleanSql.includes('SELECT COALESCE(SUM(valor_total), 0) AS faturamento_total')) {
          return {
            get: (dInicio1: string | null, _dInicio2: string | null, dFim1: string | null, _dFim2: string | null) => {
              let filtered = mockVendas
              if (dInicio1) {
                filtered = filtered.filter((v) => v.created_at.substring(0, 10) >= dInicio1)
              }
              if (dFim1) {
                filtered = filtered.filter((v) => v.created_at.substring(0, 10) <= dFim1)
              }

              const faturamento_total = filtered.reduce((acc, v) => acc + v.valor_total, 0)
              const quantidade_total = filtered.reduce((acc, v) => acc + v.quantidade_total, 0)
              const total_vendas = filtered.length

              return {
                faturamento_total,
                quantidade_total,
                total_vendas
              }
            }
          }
        }

        // getVendasUltimos7Dias query
        if (cleanSql.includes('SELECT substr(created_at, 1, 10) AS dia')) {
          return {
            all: (dInicio: string) => {
              const map = new Map<
                string,
                { dia: string; valor_total: number; quantidade_total: number; vendas_count: number }
              >()

              const filtered = mockVendas.filter((v) => v.created_at.substring(0, 10) >= dInicio)
              for (const v of filtered) {
                const dia = v.created_at.substring(0, 10)
                const current = map.get(dia) || {
                  dia,
                  valor_total: 0,
                  quantidade_total: 0,
                  vendas_count: 0
                }
                current.valor_total += v.valor_total
                current.quantidade_total += v.quantidade_total
                current.vendas_count += 1
                map.set(dia, current)
              }

              return Array.from(map.values())
            }
          }
        }

        // getPrevisibilidadeEstoque query
        if (cleanSql.includes('ORDER BY v.created_at ASC')) {
          return {
            all: () => {
              return mockVendaItens
                .map((vi) => {
                  const venda = mockVendas.find((v) => v.id === vi.venda_id)
                  return {
                    tecido_id: vi.tecido_id,
                    tecido_nome: vi.tecido_nome,
                    tecido_codigo: vi.tecido_codigo,
                    cor_id: vi.cor_id,
                    cor_nome: vi.cor_nome,
                    cor_codigo: vi.cor_codigo,
                    cor_hex: vi.cor_hex,
                    sku: `${vi.tecido_codigo}-${vi.cor_codigo}`,
                    quantidade: vi.quantidade,
                    subtotal: vi.subtotal,
                    preco_unitario: vi.subtotal / (vi.quantidade || 1),
                    venda_created_at: venda?.created_at || new Date().toISOString()
                  }
                })
                .sort((a, b) => new Date(a.venda_created_at).getTime() - new Date(b.venda_created_at).getTime())
            }
          }
        }

        // getVendasPorTecidoCor query
        if (cleanSql.includes('FROM venda_itens vi JOIN vendas v ON v.id = vi.venda_id')) {
          return {
            all: (dInicio1: string | null, _dInicio2: string | null, dFim1: string | null, _dFim2: string | null) => {
              const joined = mockVendaItens
                .map((vi) => {
                  const venda = mockVendas.find((v) => v.id === vi.venda_id)
                  return { vi, venda }
                })
                .filter(({ venda }) => {
                  if (!venda) return false
                  const dia = venda.created_at.substring(0, 10)
                  if (dInicio1 && dia < dInicio1) return false
                  if (dFim1 && dia > dFim1) return false
                  return true
                })

              // Agrupa por tecido e cor
              type GroupKey = string
              const grouped = new Map<
                GroupKey,
                {
                  tecido_id: string
                  tecido_nome: string
                  tecido_codigo: string
                  cor_id: string
                  cor_nome: string
                  cor_codigo: string
                  cor_hex: string | null
                  quantidade_total: number
                  valor_total: number
                  itens_count: number
                }
              >()

              for (const { vi } of joined) {
                const key = `${vi.tecido_id}_${vi.cor_id}`
                const current = grouped.get(key) || {
                  tecido_id: vi.tecido_id,
                  tecido_nome: vi.tecido_nome,
                  tecido_codigo: vi.tecido_codigo,
                  cor_id: vi.cor_id,
                  cor_nome: vi.cor_nome,
                  cor_codigo: vi.cor_codigo,
                  cor_hex: vi.cor_hex,
                  quantidade_total: 0,
                  valor_total: 0,
                  itens_count: 0
                }

                current.quantidade_total += vi.quantidade
                current.valor_total += vi.subtotal
                current.itens_count += 1
                grouped.set(key, current)
              }

              return Array.from(grouped.values())
            }
          }
        }

        throw new Error(`Unhandled mock query: ${cleanSql}`)
      }
    })
  }
})

describe('RelatoriosService', () => {
  beforeEach(() => {
    resetMockDb()
  })

  it('should compute aggregated KPIs correctly for all period', () => {
    const kpis = RelatoriosService.getKpis()

    expect(kpis.faturamentoTotal).toBe(1000.0)
    expect(kpis.quantidadeTotalMetros).toBe(20.0)
    expect(kpis.totalVendas).toBe(2)
    expect(kpis.ticketMedioVenda).toBe(500.0)
    expect(kpis.precoMedioMetro).toBe(50.0)
  })

  it('should return zeroes in KPIs when no vendas exist', () => {
    mockVendas = []
    const kpis = RelatoriosService.getKpis()

    expect(kpis.faturamentoTotal).toBe(0)
    expect(kpis.quantidadeTotalMetros).toBe(0)
    expect(kpis.totalVendas).toBe(0)
    expect(kpis.ticketMedioVenda).toBe(0)
    expect(kpis.precoMedioMetro).toBe(0)
  })

  it('should filter KPIs by date range', () => {
    const todayStr = new Date().toISOString().substring(0, 10)
    const kpis = RelatoriosService.getKpis({ dataInicio: todayStr, dataFim: todayStr })

    expect(kpis.faturamentoTotal).toBe(600.0)
    expect(kpis.quantidadeTotalMetros).toBe(12.0)
    expect(kpis.totalVendas).toBe(1)
    expect(kpis.ticketMedioVenda).toBe(600.0)
    expect(kpis.precoMedioMetro).toBe(50.0)
  })

  it('should return exactly 7 consecutive days for getVendasUltimos7Dias', () => {
    const dias = RelatoriosService.getVendasUltimos7Dias()

    expect(dias).toHaveLength(7)

    const todayStr = new Date().toISOString().substring(0, 10)
    const todayItem = dias.find((d) => d.data === todayStr)
    expect(todayItem).toBeDefined()
    expect(todayItem?.valorTotal).toBe(600.0)
    expect(todayItem?.quantidadeTotal).toBe(12.0)
    expect(todayItem?.vendasCount).toBe(1)

    // Dias sem vendas devem ter 0
    const zeroItem = dias.find((d) => d.valorTotal === 0)
    expect(zeroItem).toBeDefined()
    expect(zeroItem?.vendasCount).toBe(0)
  })

  it('should aggregate sales by Tecido and Cor with correct percentages', () => {
    const relatorio = RelatoriosService.getVendasPorTecidoCor()

    expect(relatorio.kpis.faturamentoTotal).toBe(1000.0)
    expect(relatorio.tecidos).toHaveLength(2)

    // Primeiro tecido (Tricoline - maior faturamento: 600 vs 400)
    const tricoline = relatorio.tecidos[0]
    expect(tricoline.tecidoId).toBe('tec-1')
    expect(tricoline.tecidoNome).toBe('Tricoline')
    expect(tricoline.valorTotal).toBe(600.0)
    expect(tricoline.quantidadeTotal).toBe(12.0)
    expect(tricoline.precoMedio).toBe(50.0)
    expect(tricoline.percentualGeral).toBe(60.0) // 600 / 1000 * 100

    expect(tricoline.cores).toHaveLength(2)
    // Cor Azul: 500 faturado (83.33% de Tricoline, 50% geral)
    const corAzul = tricoline.cores[0]
    expect(corAzul.corNome).toBe('Azul')
    expect(corAzul.valorTotal).toBe(500.0)
    expect(corAzul.percentualTecido).toBe(83.33)
    expect(corAzul.percentualGeral).toBe(50.0)

    // Cor Preto: 100 faturado (16.67% de Tricoline, 10% geral)
    const corPreto = tricoline.cores[1]
    expect(corPreto.corNome).toBe('Preto')
    expect(corPreto.valorTotal).toBe(100.0)
    expect(corPreto.percentualTecido).toBe(16.67)
    expect(corPreto.percentualGeral).toBe(10.0)

    // Segundo tecido (Seda)
    // Seda
    const seda = relatorio.tecidos[1]
    expect(seda.tecidoId).toBe('tec-2')
    expect(seda.valorTotal).toBe(400.0)
    expect(seda.percentualGeral).toBe(40.0)
    expect(seda.cores).toHaveLength(1)
    expect(seda.cores[0].corNome).toBe('Branco')
    expect(seda.cores[0].percentualTecido).toBe(100.0)
    expect(seda.cores[0].percentualGeral).toBe(40.0)
  })

  it('should calculate demand forecasting with Croston-SBA and ABC classification', () => {
    const result = RelatoriosService.getPrevisibilidadeEstoque({ horizonteDias: 30 })

    expect(result.kpis.horizonteDias).toBe(30)
    expect(result.itens.length).toBe(3) // 3 SKUs (Tricoline Azul, Tricoline Preto, Seda Branco)

    // Curva ABC: maior volume é Tricoline Azul (10m / 20m = 50% => Classe A)
    const azul = result.itens.find((i) => i.corNome === 'Azul')
    expect(azul).toBeDefined()
    expect(azul?.curvaAbc).toBe('A')
    expect(azul?.demandaPrevistaMetros).toBeGreaterThan(0)
    expect(azul?.demandaPrevistaRolos).toBeGreaterThanOrEqual(1)
    expect(azul?.valorPrevistoReposicao).toBeGreaterThan(0)

    // Teste com horizonte de 7 dias
    const result7d = RelatoriosService.getPrevisibilidadeEstoque({ horizonteDias: 7 })
    expect(result7d.kpis.horizonteDias).toBe(7)
    expect(result7d.kpis.demandaTotalProjetadaMetros).toBeLessThan(result.kpis.demandaTotalProjetadaMetros)

    // Teste com filtro por Curva ABC
    const resultClasseA = RelatoriosService.getPrevisibilidadeEstoque({ curvaAbc: 'A' })
    expect(resultClasseA.itens.every((i) => i.curvaAbc === 'A')).toBe(true)
  })
})
