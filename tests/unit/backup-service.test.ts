import { describe, it, expect } from 'vitest'
import { convertToCsv } from '../../src/main/services/backup.service'

describe('BackupService — CSV Export', () => {
  it('should generate CSV with UTF-8 BOM prefix', () => {
    const columns = [
      { key: 'codigo', label: 'SKU' },
      { key: 'nome', label: 'Nome' }
    ]
    const rows = [{ codigo: 'TRAL', nome: 'Tricoline Lisa' }]

    const csv = convertToCsv(columns, rows)
    expect(csv.startsWith('\uFEFF')).toBe(true)
  })

  it('should correctly format headers and rows with semicolon delimiter', () => {
    const columns = [
      { key: 'codigo', label: 'SKU' },
      { key: 'nome', label: 'Nome' },
      { key: 'largura', label: 'Largura (m)' }
    ]
    const rows = [
      { codigo: 'TRAL', nome: 'Tricoline Lisa', largura: 1.5 },
      { codigo: 'CETI', nome: 'Cetim Especial', largura: 1.4 }
    ]

    const csv = convertToCsv(columns, rows)
    const lines = csv.replace('\uFEFF', '').split('\r\n')

    expect(lines[0]).toBe('SKU;Nome;Largura (m)')
    expect(lines[1]).toBe('TRAL;Tricoline Lisa;1.5')
    expect(lines[2]).toBe('CETI;Cetim Especial;1.4')
  })

  it('should escape quotes, semicolons, and commas in cell values', () => {
    const columns = [
      { key: 'codigo', label: 'SKU' },
      { key: 'nome', label: 'Nome' },
      { key: 'composicao', label: 'Composição' }
    ]
    const rows = [
      {
        codigo: 'ALGO',
        nome: 'Tecido "Premium"; Especial',
        composicao: '95% Algodão, 5% Elastano'
      }
    ]

    const csv = convertToCsv(columns, rows)
    const lines = csv.replace('\uFEFF', '').split('\r\n')

    expect(lines[1]).toBe('ALGO;"Tecido ""Premium""; Especial";"95% Algodão, 5% Elastano"')
  })

  it('should handle null and undefined values cleanly', () => {
    const columns = [
      { key: 'codigo', label: 'SKU' },
      { key: 'rendimento', label: 'Rendimento' }
    ]
    const rows = [{ codigo: 'TEST', rendimento: null }]

    const csv = convertToCsv(columns, rows)
    const lines = csv.replace('\uFEFF', '').split('\r\n')

    expect(lines[1]).toBe('TEST;')
  })
})
