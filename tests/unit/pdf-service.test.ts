import { describe, it, expect } from 'vitest'
import { PdfService } from '../../src/main/services/pdf/pdf.service'
import type { PedidoRecord } from '../../src/shared/types'

describe('PdfService — Geração de PDF e Design Brutalista A4', () => {
  const basePedido: PedidoRecord = {
    id: 'ped-1',
    numero: 42,
    clienteNome: 'Ateliê Alta Costura',
    status: 'pendente',
    valorTotal: 1250.0,
    quantidadeTotal: 25.0,
    itensCount: 2,
    observacoes: 'Entregar na portaria B às 14h',
    createdAt: '2026-08-19T14:30:00.000Z',
    updatedAt: '2026-08-19T14:30:00.000Z',
    itens: [
      {
        id: 'pi-1',
        pedidoId: 'ped-1',
        tecidoId: '1',
        corId: '1',
        sku: 'TRAL-PRETABSO',
        tecidoNome: 'Tricoline Lisa 100% Algodão',
        tecidoCodigo: 'TRAL',
        corNome: 'Preto Absoluto',
        corCodigo: 'PRETABSO',
        precoUnitario: 50.0,
        quantidade: 15.0,
        subtotal: 750.0,
        createdAt: '2026-08-19T14:30:00.000Z'
      },
      {
        id: 'pi-2',
        pedidoId: 'ped-1',
        tecidoId: '2',
        corId: '2',
        sku: 'CETI-BRANPURO',
        tecidoNome: 'Cetim Especial',
        tecidoCodigo: 'CETI',
        corNome: 'Branco Puro',
        corCodigo: 'BRANPURO',
        precoUnitario: 50.0,
        quantidade: 10.0,
        subtotal: 500.0,
        createdAt: '2026-08-19T14:30:00.000Z'
      }
    ]
  }

  it('deve gerar HTML com formatação de página A4 e dimensões padronizadas', () => {
    const html = PdfService.generatePedidoHtml(basePedido)

    expect(html).toContain('@page {')
    expect(html).toContain('size: A4;')
    expect(html).toContain('margin: 15mm 12mm 15mm 12mm;')
  })

  it('deve utilizar fundo branco e alto contraste preto/cinza para economia e nitidez de impressão', () => {
    const html = PdfService.generatePedidoHtml(basePedido)

    // Fundo limpo e cores de alto contraste
    expect(html).toContain('background: #ffffff;')
    expect(html).toContain('color: #000000;')
    expect(html).toContain('border: 1px solid #000000;')
    expect(html).toContain('-webkit-print-color-adjust: exact;')
  })

  it('deve conter tipografia monoespaçada técnica e layout de grade industrial', () => {
    const html = PdfService.generatePedidoHtml(basePedido)

    expect(html).toContain("font-family: 'Courier New', Courier, monospace")
    expect(html).toContain('RAZAI / SISTEMA')
    expect(html).toContain('PEDIDO #PED-0042')
    expect(html).toContain('Ateliê Alta Costura')
  })

  it('deve renderizar todas as linhas de itens com SKUs compostos, metragens e subtotais', () => {
    const html = PdfService.generatePedidoHtml(basePedido)

    expect(html).toContain('TRAL-PRETABSO')
    expect(html).toContain('Tricoline Lisa 100% Algodão')
    expect(html).toContain('Preto Absoluto')
    expect(html).toContain('15,00 m')
    expect(html).toContain('R$ 750,00')

    expect(html).toContain('CETI-BRANPURO')
    expect(html).toContain('Cetim Especial')
    expect(html).toContain('Branco Puro')
    expect(html).toContain('10,00 m')
    expect(html).toContain('R$ 500,00')
  })

  it('deve conter quadro de totais consolidados e observações', () => {
    const html = PdfService.generatePedidoHtml(basePedido)

    expect(html).toContain('2 itens')
    expect(html).toContain('25,00 m')
    expect(html).toContain('R$ 1.250,00')
    expect(html).toContain('Entregar na portaria B às 14h')
  })

  it('deve tratar pedidos sem observações ou sem nome de cliente de forma limpa', () => {
    const pedidoSimples: PedidoRecord = {
      ...basePedido,
      clienteNome: null,
      observacoes: null
    }

    const html = PdfService.generatePedidoHtml(pedidoSimples)

    expect(html).toContain('CONSUMIDOR FINAL / BALCÃO')
    expect(html).not.toContain('Observações do Pedido:')
  })

  it('deve incluir regras de proteção contra quebras de página em linhas de tabela', () => {
    const html = PdfService.generatePedidoHtml(basePedido)

    expect(html).toContain('page-break-inside: avoid;')
    expect(html).toContain('Responsável Razai')
    expect(html).toContain('Aceite do Cliente')
  })
})
