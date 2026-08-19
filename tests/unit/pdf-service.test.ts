import { describe, it, expect } from 'vitest'
import { PdfService } from '../../src/main/services/pdf/pdf.service'
import type { PedidoRecord } from '../../src/shared/types'

describe('PdfService', () => {
  it('should generate valid A4 HTML string for a pedido with brutalist styling and all item lines', () => {
    const pedido: PedidoRecord = {
      id: 'ped-1',
      numero: 12,
      clienteNome: 'Ateliê Alfa',
      status: 'pendente',
      valorTotal: 850.5,
      quantidadeTotal: 15.0,
      itensCount: 2,
      observacoes: 'Entregar com nota',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      itens: [
        {
          id: 'pi-1',
          pedidoId: 'ped-1',
          tecidoId: '1',
          corId: '1',
          sku: 'TRAL-PRETABSO',
          tecidoNome: 'Tricoline Lisa',
          tecidoCodigo: 'TRAL',
          corNome: 'Preto Absoluto',
          corCodigo: 'PRETABSO',
          precoUnitario: 50.0,
          quantidade: 10.0,
          subtotal: 500.0,
          createdAt: new Date().toISOString()
        },
        {
          id: 'pi-2',
          pedidoId: 'ped-1',
          tecidoId: '2',
          corId: '2',
          sku: 'CETI-BRANPURO',
          tecidoNome: 'Cetim',
          tecidoCodigo: 'CETI',
          corNome: 'Branco Puro',
          corCodigo: 'BRANPURO',
          precoUnitario: 70.1,
          quantidade: 5.0,
          subtotal: 350.5,
          createdAt: new Date().toISOString()
        }
      ]
    }

    const html = PdfService.generatePedidoHtml(pedido)
    expect(html).toContain('PEDIDO #PED-0012')
    expect(html).toContain('Ateliê Alfa')
    expect(html).toContain('TRAL-PRETABSO')
    expect(html).toContain('CETI-BRANPURO')
    expect(html).toContain('Entregar com nota')
    expect(html).toContain('size: A4;')
    expect(html).toContain('RAZAI / SISTEMA')
  })
})
