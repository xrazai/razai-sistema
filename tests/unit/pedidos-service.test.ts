import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PedidosService } from '../../src/main/services/pedidos.service'
import type { CreatePedidoInput, UpdatePedidoInput } from '../../src/shared/types'

type MockPedido = {
  id: string
  numero: number
  cliente_nome: string | null
  status: string
  valor_total: number
  quantidade_total: number
  itens_count: number
  observacoes: string | null
  venda_gerada_id: string | null
  created_at: string
  updated_at: string
}

type MockPedidoItem = {
  id: string
  pedido_id: string
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

let mockPedidos: MockPedido[] = []
let mockPedidoItens: MockPedidoItem[] = []

function resetMockDb() {
  const now = new Date().toISOString()
  mockPedidos = [
    {
      id: 'ped-1',
      numero: 1,
      cliente_nome: 'Boutique Bella',
      status: 'pendente',
      valor_total: 600.0,
      quantidade_total: 12.0,
      itens_count: 1,
      observacoes: 'Separar para retirada na sexta',
      venda_gerada_id: null,
      created_at: now,
      updated_at: now
    }
  ]

  mockPedidoItens = [
    {
      id: 'pi-1',
      pedido_id: 'ped-1',
      tecido_id: '1',
      cor_id: '1',
      vinculo_id: 'v1',
      sku: 'TRAL-PRETABSO',
      tecido_nome: 'Tricoline Lisa',
      tecido_codigo: 'TRAL',
      cor_nome: 'Preto Absoluto',
      cor_codigo: 'PRETABSO',
      cor_hex: '#000000',
      preco_unitario: 50.0,
      quantidade: 12.0,
      subtotal: 600.0,
      created_at: now
    }
  ]
}

vi.mock('../../src/main/services/vendas.service', () => {
  return {
    VendasService: {
      create: vi.fn((input) => ({
        id: 'ven-gen-1',
        numero: 99,
        pedidoOrigemId: input.pedidoOrigemId,
        clienteNome: input.clienteNome,
        valorTotal: input.itens.reduce((acc: number, i: any) => acc + i.subtotal, 0),
        quantidadeTotal: input.itens.reduce((acc: number, i: any) => acc + i.quantidade, 0),
        itensCount: input.itens.length,
        formaPagamento: input.formaPagamento,
        observacoes: input.observacoes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        itens: input.itens
      }))
    }
  }
})

vi.mock('../../src/main/database/db', () => {
  return {
    getDb: () => ({
      transaction: (fn: () => void) => () => fn(),
      prepare: (sql: string) => {
        const cleanSql = sql.replace(/\s+/g, ' ').trim()

        if (cleanSql.includes('SELECT MAX(numero) as max_num FROM pedidos')) {
          return {
            get: () => {
              const max = mockPedidos.reduce((acc, p) => Math.max(acc, p.numero), 0)
              return { max_num: max }
            }
          }
        }

        if (cleanSql.includes('INSERT INTO pedidos')) {
          return {
            run: (
              id: string,
              numero: number,
              clienteNome: string | null,
              status: string,
              valorTotal: number,
              quantidadeTotal: number,
              itensCount: number,
              observacoes: string | null,
              vendaGeradaId: string | null,
              createdAt: string,
              updatedAt: string
            ) => {
              mockPedidos.push({
                id,
                numero,
                cliente_nome: clienteNome,
                status,
                valor_total: valorTotal,
                quantidade_total: quantidadeTotal,
                itens_count: itensCount,
                observacoes,
                venda_gerada_id: vendaGeradaId,
                created_at: createdAt,
                updated_at: updatedAt
              })
              return { changes: 1 }
            }
          }
        }

        if (cleanSql.includes('INSERT INTO pedido_itens')) {
          return {
            run: (
              id: string,
              pedidoId: string,
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
              mockPedidoItens.push({
                id,
                pedido_id: pedidoId,
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

        if (cleanSql.includes('UPDATE pedidos SET cliente_nome = ?')) {
          return {
            run: (
              clienteNome: string | null,
              status: string,
              valorTotal: number,
              quantidadeTotal: number,
              itensCount: number,
              observacoes: string | null,
              updatedAt: string,
              id: string
            ) => {
              const ped = mockPedidos.find((p) => String(p.id) === String(id))
              if (ped) {
                ped.cliente_nome = clienteNome
                ped.status = status
                ped.valor_total = valorTotal
                ped.quantidade_total = quantidadeTotal
                ped.itens_count = itensCount
                ped.observacoes = observacoes
                ped.updated_at = updatedAt
              }
              return { changes: 1 }
            }
          }
        }

        if (cleanSql.includes('UPDATE pedidos SET status = ?, updated_at = ?')) {
          return {
            run: (updatedAt: string, id: string) => {
              const ped = mockPedidos.find((p) => String(p.id) === String(id))
              if (ped) {
                ped.status = 'cancelado'
                ped.updated_at = updatedAt
              }
              return { changes: 1 }
            }
          }
        }

        if (cleanSql.includes('UPDATE pedidos SET status = \'aprovado\', venda_gerada_id = ?')) {
          return {
            run: (vendaId: string, updatedAt: string, id: string) => {
              const ped = mockPedidos.find((p) => String(p.id) === String(id))
              if (ped) {
                ped.status = 'aprovado'
                ped.venda_gerada_id = vendaId
                ped.updated_at = updatedAt
              }
              return { changes: 1 }
            }
          }
        }

        if (cleanSql.includes('DELETE FROM pedido_itens WHERE CAST(pedido_id AS TEXT) = ?')) {
          return {
            run: (pedidoId: string) => {
              mockPedidoItens = mockPedidoItens.filter((i) => String(i.pedido_id) !== String(pedidoId))
              return { changes: 1 }
            }
          }
        }

        if (cleanSql.includes('SELECT * FROM pedidos WHERE CAST(id AS TEXT) = ?')) {
          return {
            get: (id: string) => mockPedidos.find((p) => String(p.id) === String(id))
          }
        }

        if (cleanSql.includes('SELECT * FROM pedido_itens WHERE CAST(pedido_id AS TEXT) = ?')) {
          return {
            all: (pedidoId: string) => mockPedidoItens.filter((i) => String(i.pedido_id) === String(pedidoId))
          }
        }

        if (cleanSql.includes('SELECT * FROM pedido_itens')) {
          return {
            all: () => mockPedidoItens
          }
        }

        if (cleanSql.includes('SELECT * FROM pedidos ORDER BY numero DESC')) {
          return {
            all: () => [...mockPedidos].sort((a, b) => b.numero - a.numero)
          }
        }

        if (cleanSql.includes('DELETE FROM pedidos WHERE CAST(id AS TEXT) = ?')) {
          return {
            run: (id: string) => {
              const prev = mockPedidos.length
              mockPedidos = mockPedidos.filter((p) => String(p.id) !== String(id))
              mockPedidoItens = mockPedidoItens.filter((i) => String(i.pedido_id) !== String(id))
              return { changes: prev - mockPedidos.length }
            }
          }
        }

        throw new Error(`Unhandled mock query: ${cleanSql}`)
      }
    })
  }
})

describe('PedidosService', () => {
  beforeEach(() => {
    resetMockDb()
  })

  it('should list all pedidos with their items and status', () => {
    const list = PedidosService.list()
    expect(list.length).toBe(1)
    expect(list[0].numero).toBe(1)
    expect(list[0].status).toBe('pendente')
    expect(list[0].clienteNome).toBe('Boutique Bella')
    expect(list[0].valorTotal).toBe(600.0)
    expect(list[0].itens?.length).toBe(1)
  })

  it('should create a new pedido', () => {
    const input: CreatePedidoInput = {
      clienteNome: 'Confecção Silva',
      observacoes: 'Urgente para segunda-feira',
      itens: [
        {
          tecidoId: '2',
          corId: '3',
          sku: 'CETI-AMARCAN',
          tecidoNome: 'Cetim',
          tecidoCodigo: 'CETI',
          corNome: 'Amarelo Canário',
          corCodigo: 'AMARCAN',
          precoUnitario: 35.0,
          quantidade: 20.0,
          subtotal: 700.0
        }
      ]
    }

    const created = PedidosService.create(input)
    expect(created.numero).toBe(2)
    expect(created.status).toBe('pendente')
    expect(created.clienteNome).toBe('Confecção Silva')
    expect(created.valorTotal).toBe(700.0)
    expect(created.quantidadeTotal).toBe(20.0)

    const list = PedidosService.list()
    expect(list.length).toBe(2)
  })

  it('should update an existing pedido', () => {
    const updateInput: UpdatePedidoInput = {
      clienteNome: 'Boutique Bella Atualizada',
      observacoes: 'Observação alterada',
      status: 'pendente'
    }

    const updated = PedidosService.update('ped-1', updateInput)
    expect(updated.clienteNome).toBe('Boutique Bella Atualizada')
    expect(updated.observacoes).toBe('Observação alterada')
  })

  it('should approve a pedido and convert it into a venda', () => {
    const res = PedidosService.aprovar('ped-1')
    expect(res.pedido.status).toBe('aprovado')
    expect(res.pedido.vendaGeradaId).toBe('ven-gen-1')
    expect(res.venda).toBeDefined()
  })

  it('should delete a pedido by id', () => {
    const deleted = PedidosService.delete('ped-1')
    expect(deleted).toBe(true)

    const list = PedidosService.list()
    expect(list.length).toBe(0)
  })
})
