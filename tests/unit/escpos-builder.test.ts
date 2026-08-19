import { describe, it, expect } from 'vitest'
import { EscPosBuilder } from '../../src/main/services/printer/escpos.builder'

describe('EscPosBuilder', () => {
  it('should initialize with ESC @ and CP850 charset', () => {
    const builder = new EscPosBuilder()
    builder.init()
    const buf = builder.toBuffer()

    expect(buf[0]).toBe(0x1b)
    expect(buf[1]).toBe(0x40) // ESC @
    expect(buf[2]).toBe(0x1b)
    expect(buf[3]).toBe(0x74)
    expect(buf[4]).toBe(0x02) // CP850
  })

  it('should set text alignment correctly', () => {
    const builder = new EscPosBuilder()
    builder.align('center')
    let buf = builder.toBuffer()
    expect(buf).toEqual(Buffer.from([0x1b, 0x61, 0x01]))

    const leftBuilder = new EscPosBuilder()
    leftBuilder.align('left')
    expect(leftBuilder.toBuffer()).toEqual(Buffer.from([0x1b, 0x61, 0x00]))

    const rightBuilder = new EscPosBuilder()
    rightBuilder.align('right')
    expect(rightBuilder.toBuffer()).toEqual(Buffer.from([0x1b, 0x61, 0x02]))
  })

  it('should set bold mode', () => {
    const builder = new EscPosBuilder()
    builder.bold(true)
    expect(builder.toBuffer()).toEqual(Buffer.from([0x1b, 0x45, 0x01]))

    const offBuilder = new EscPosBuilder()
    offBuilder.bold(false)
    expect(offBuilder.toBuffer()).toEqual(Buffer.from([0x1b, 0x45, 0x00]))
  })

  it('should format two justified columns to exactly 48 columns in 80mm', () => {
    const builder = new EscPosBuilder(48)
    builder.twoColumns('TOTAL:', 'R$ 100,00')
    const buf = builder.toBuffer()
    const str = buf.toString('latin1')

    // 48 chars + \n (0x0A)
    expect(str.endsWith('\n')).toBe(true)
    const lineWithoutNewline = str.slice(0, -1)
    expect(lineWithoutNewline.length).toBe(48)
    expect(lineWithoutNewline.startsWith('TOTAL:')).toBe(true)
    expect(lineWithoutNewline.endsWith('R$ 100,00')).toBe(true)
  })

  it('should format 4 table columns to exactly 48 columns', () => {
    const builder = new EscPosBuilder(48)
    builder.table4Columns('LINHO PURO CRU', '10m', '45,00', '450,00')
    const buf = builder.toBuffer()
    const str = buf.toString('latin1')

    const line = str.slice(0, -1)
    expect(line.length).toBe(48)
  })

  it('should map Portuguese accents to CP850', () => {
    const builder = new EscPosBuilder()
    builder.text('Algodão & Confecção')
    const buf = builder.toBuffer()

    // ã in CP850 is 0xC6, ç in CP850 is 0x87
    expect(buf.includes(0xc6)).toBe(true)
    expect(buf.includes(0x87)).toBe(true)
  })

  it('should append cut command with line feeds', () => {
    const builder = new EscPosBuilder()
    builder.cut()
    const buf = builder.toBuffer()

    // Feed lines: ESC d 3 (0x1b, 0x64, 0x03)
    // Cut command: GS V 65 0 (0x1d, 0x56, 0x41, 0x00)
    expect(buf[0]).toBe(0x1b)
    expect(buf[1]).toBe(0x64)
    expect(buf[2]).toBe(0x03)
    expect(buf[3]).toBe(0x1d)
    expect(buf[4]).toBe(0x56)
    expect(buf[5]).toBe(0x41)
    expect(buf[6]).toBe(0x00)
  })
})
