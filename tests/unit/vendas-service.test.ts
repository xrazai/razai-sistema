import { describe, it, expect, beforeEach, vi } from 'vitest'
import { VendasService } from '../../src/main/services/vendas.service'
import type { CreateVendaInput } from '../../src/shared/types'

type MockVenda = {
  id: string
  numero: number
  pedido_origem_id: string | null
  cliente_nome: string | null
  valor_total: number
  quantidade_total: number
  itens_count: number
  forma_pagamento: string | null
  observacoes: string | null
  created_at: string
  updated_at: string
}

type MockVendaItem = {
  id: string
  venda_id: string
  tecido_id: string
  cor_id: string
  vinculo_id: string | null
  sku: string
  tecido_nome: string
  tecido_codigo: string
  cor_nome: string
  cor_codigo: string
  cor_hex: string | null
  preco_unitario: number
  quantidade: number
  subtotal: number
  created_at: string
}

let mockVendas: MockVenda[] = []
let mockVendaItens: MockVendaItem[] = []

function resetMockDb() {
  const now = new Date().toISOString()
  mockVendas = [
    {
      id: 'ven-1',
      numero: 1,
      pedido_origem_id: null,
      cliente_nome: 'Ateliê Elegance',
      valor_total: 450.0,
      quantidade_total: 10.0,
      itens_count: 1,
      forma_pagamento: 'Dinheiro / PIX',
      observacoes: 'Entrega balcão',
      created_at: now,
      updated_at: now
    }
  ]

  mockVendaItens = [
    {
      id: 'vi-1',
      venda_id: 'ven-1',
      tecido_id: '1',
      cor_id: '4',
      vinculo_id: 'v1',
      sku: 'TRAL-AZULMARI',
      tecido_nome: 'Tricoline Lisa',
      tecido_codigo: 'TRAL',
      cor_nome: 'Azul Marinho',
      cor_codigo: 'AZULMARI',
      cor_hex: '#002244',
      preco_unitario: 45.0,
      quantidade: 10.0,
      subtotal: 450.0,
      created_at: now
    }
  ]
}

vi.mock('../../src/main/database/db', () => {
  return {
    getDb: () => ({
      transaction: (fn: () => void) => () => fn(),
      prepare: (sql: string) => {
        const cleanSql = sql.replace(/\s+/g, ' ').trim()

        if (cleanSql.includes('SELECT MAX(numero) as max_num FROM vendas')) {
          return {
            get: () => {
              const max = mockVendas.reduce((acc, v) => Math.max(acc, v.numero), 0)
              return { max_num: max }
            }
          }
        }

        if (cleanSql.includes('INSERT INTO vendas')) {
          return {
            run: (
              id: string,
              numero: number,
              pedidoOrigemId: string | null,
              clienteNome: string | null,
              valorTotal: number,
              quantidadeTotal: number,
              itensCount: number,
              formaPagamento: string | null,
              observacoes: string | null,
              createdAt: string,
              updatedAt: string
            ) => {
              mockVendas.push({
                id,
                numero,
                pedido_origem_id: pedidoOrigemId,
                cliente_nome: clienteNome,
                valor_total: valorTotal,
                quantidade_total: quantidadeTotal,
                itens_count: itensCount,
                forma_pagamento: formaPagamento,
                observacoes,
                created_at: createdAt,
                updated_at: updatedAt
              })
              return { changes: 1 }
            }
          }
        }

        if (cleanSql.includes('INSERT INTO venda_itens')) {
          return {
            run: (
              id: string,
              vendaId: string,
              tecidoId: string,
              corId: string,
              vinculoId: string | null,
              sku: string,
              tecidoNome: string,
              tecidoCodigo: string,
              corNome: string,
              corCodigo: string,
              corHex: string | null,
              precoUnitario: number,
              quantidade: number,
              subtotal: number,
              createdAt: string
            ) => {
              mockVendaItens.push({
                id,
                venda_id: vendaId,
                tecido_id: tecidoId,
                cor_id: corId,
                vinculo_id: vinculoId,
                sku,
                tecido_nome: tecidoNome,
                tecido_codigo: tecidoCodigo,
                cor_nome: corNome,
                cor_codigo: corCodigo,
                cor_hex: corHex,
                preco_unitario: precoUnitario,
                quantidade,
                subtotal,
                created_at: createdAt
              })
              return { changes: 1 }
            }
          }
        }

        if (cleanSql.includes('SELECT * FROM vendas WHERE CAST(id AS TEXT) = ?')) {
          return {
            get: (id: string) => mockVendas.find((v) => String(v.id) === String(id))
          }
        }

        if (cleanSql.includes('SELECT * FROM venda_itens WHERE CAST(venda_id AS TEXT) = ?')) {
          return {
            all: (vendaId: string) => mockVendaItens.filter((i) => String(i.venda_id) === String(vendaId))
          }
        }

        if (cleanSql.includes('SELECT * FROM venda_itens')) {
          return {
            all: () => mockVendaItens
          }
        }

        if (cleanSql.includes('SELECT * FROM vendas ORDER BY numero DESC')) {
          return {
            all: () => [...mockVendas].sort((a, b) => b.numero - a.numero)
          }
        }

        if (cleanSql.includes('DELETE FROM vendas WHERE CAST(id AS TEXT) = ?')) {
          return {
            run: (id: string) => {
              const prev = mockVendas.length
              mockVendas = mockVendas.filter((v) => String(v.id) !== String(id))
              mockVendaItens = mockVendaItens.filter((i) => String(i.venda_id) !== String(id))
              return { changes: prev - mockVendas.length }
            }
          }
        }

        throw new Error(`Unhandled mock query: ${cleanSql}`)
      }
    })
  }
})

describe('VendasService', () => {
  beforeEach(() => {
    resetMockDb()
  })

  it('should list all vendas with their items', () => {
    const list = VendasService.list()
    expect(list.length).toBe(1)
    expect(list[0].numero).toBe(1)
    expect(list[0].clienteNome).toBe('Ateliê Elegance')
    expect(list[0].valorTotal).toBe(450.0)
    expect(list[0].itens?.length).toBe(1)
    expect(list[0].itens?.[0].sku).toBe('TRAL-AZULMARI')
  })

  it('should get venda by id', () => {
    const venda = VendasService.getById('ven-1')
    expect(venda).not.toBeNull()
    expect(venda?.id).toBe('ven-1')
    expect(venda?.itens?.length).toBe(1)
  })

  it('should create a new venda and calculate sequential numero and totals', () => {
    const input: CreateVendaInput = {
      clienteNome: 'Costura Fina',
      formaPagamento: 'Cartão de Débito',
      itens: [
        {
          tecidoId: '1',
          corId: '1',
          sku: 'TRAL-PRETABSO',
          tecidoNome: 'Tricoline Lisa',
          tecidoCodigo: 'TRAL',
          corNome: 'Preto Absoluto',
          corCodigo: 'PRETABSO',
          precoUnitario: 50.0,
          quantidade: 4.0,
          subtotal: 200.0
        },
        {
          tecidoId: '2',
          corId: '2',
          sku: 'CETI-BRANPURO',
          tecidoNome: 'Cetim',
          tecidoCodigo: 'CETI',
          corNome: 'Branco Puro',
          corCodigo: 'BRANPURO',
          precoUnitario: 30.0,
          quantidade: 5.0,
          subtotal: 150.0
        }
      ]
    }

    const created = VendasService.create(input)
    expect(created.numero).toBe(2)
    expect(created.clienteNome).toBe('Costura Fina')
    expect(created.itensCount).toBe(2)
    expect(created.quantidadeTotal).toBe(9.0)
    expect(created.valorTotal).toBe(350.0)
    expect(created.itens?.length).toBe(2)

    const list = VendasService.list()
    expect(list.length).toBe(2)
  })

  it('should delete a venda by id', () => {
    const deleted = VendasService.delete('ven-1')
    expect(deleted).toBe(true)

    const list = VendasService.list()
    expect(list.length).toBe(0)
  })
})
