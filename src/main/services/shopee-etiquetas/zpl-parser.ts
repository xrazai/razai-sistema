import { createHash } from 'node:crypto'
import { inflateSync } from 'node:zlib'

export type ZplGraphic = {
  name: string
  totalBytes: number
  bytesPerRow: number
  width: number
  height: number
  data: Buffer
  hash: string
}

export type ParsedZplPage = {
  index: number
  method: 'z64' | 'fd'
  block: string
  text: string
  graphic?: ZplGraphic
}

export type ParsedZplDocument = {
  pages: ParsedZplPage[]
}

function crc16Xmodem(value: string): number {
  let crc = 0
  const bytes = Buffer.from(value, 'ascii')
  for (const byte of bytes) {
    crc ^= byte << 8
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
    }
  }
  return crc
}

function decodeFieldData(value: string, hexadecimal: boolean): string {
  if (!hexadecimal) return value.trim()
  return value.replace(/_([0-9a-f]{2})/gi, (_match, hex: string) =>
    String.fromCharCode(Number.parseInt(hex, 16))
  ).trim()
}

function extractFieldText(block: string): string {
  const hexadecimal = /\^FH(?:.)?/i.test(block)
  return [...block.matchAll(/\^FD([\s\S]*?)\^FS/gi)]
    .map((match) => decodeFieldData(match[1], hexadecimal))
    .filter(Boolean)
    .join('\n')
}

export function parseZpl(buffer: Buffer): ParsedZplDocument {
  if (!buffer.length) throw new Error('Documento ZPL vazio.')
  const source = buffer.toString('latin1')
  const graphics = new Map<string, ZplGraphic>()
  const pages: ParsedZplPage[] = []
  const tokenPattern = /~DG([A-Z]):([^,]+),(\d+),(\d+),:Z64:([\s\S]*?):([0-9A-F]{4})|\^XA([\s\S]*?)\^XZ/gi
  for (const match of source.matchAll(tokenPattern)) {
    if (match[1]) {
      const name = `${match[1].toUpperCase()}:${match[2].toUpperCase()}`
      const totalBytes = Number.parseInt(match[3], 10)
      const bytesPerRow = Number.parseInt(match[4], 10)
      const encoded = match[5].replace(/\s/g, '')
      const expectedCrc = match[6].toUpperCase()
      const actualCrc = crc16Xmodem(encoded).toString(16).toUpperCase().padStart(4, '0')
      if (actualCrc !== expectedCrc) throw new Error(`CRC Z64 inválido em ${name}: esperado ${expectedCrc}, obtido ${actualCrc}.`)
      if (!totalBytes || !bytesPerRow || totalBytes % bytesPerRow !== 0) throw new Error(`Dimensões Z64 inválidas em ${name}.`)
      const inflated = inflateSync(Buffer.from(encoded, 'base64'))
      if (inflated.length !== totalBytes) throw new Error(`Tamanho Z64 inválido em ${name}: esperado ${totalBytes}, obtido ${inflated.length}.`)
      graphics.set(name, {
        name,
        totalBytes,
        bytesPerRow,
        width: bytesPerRow * 8,
        height: totalBytes / bytesPerRow,
        data: inflated,
        hash: createHash('sha256').update(inflated).digest('hex')
      })
      continue
    }

    const block = match[0]
    const deleteRef = block.match(/\^ID([A-Z]):([^^]+)\^FS/i)
    if (deleteRef) {
      graphics.delete(`${deleteRef[1].toUpperCase()}:${deleteRef[2].toUpperCase()}`)
      continue
    }

    const graphicRef = block.match(/\^XG([A-Z]):([^,^]+)(?:,[^^]*)?\^FS/i)
    if (graphicRef) {
      const name = `${graphicRef[1].toUpperCase()}:${graphicRef[2].toUpperCase()}`
      const graphic = graphics.get(name)
      if (!graphic) throw new Error(`Gráfico ${name} referenciado, mas não carregado por ~DG.`)
      pages.push({ index: pages.length, method: 'z64', block, text: '', graphic })
      continue
    }

    if (/\^FD/i.test(block)) {
      pages.push({ index: pages.length, method: 'fd', block, text: extractFieldText(block) })
    }
  }

  if (pages.length === 0) throw new Error('Nenhuma página imprimível foi encontrada no ZPL.')
  if (pages.length > 500) throw new Error('O documento excede o limite de 500 páginas imprimíveis.')
  return { pages }
}

export function graphicToRawGrayscale(graphic: ZplGraphic): Buffer {
  const pixels = Buffer.allocUnsafe(graphic.width * graphic.height)
  let target = 0
  for (const byte of graphic.data) {
    for (let bit = 7; bit >= 0; bit -= 1) {
      pixels[target] = (byte & (1 << bit)) !== 0 ? 0 : 255
      target += 1
    }
  }
  return pixels
}

export const zplInternals = { crc16Xmodem, extractFieldText }
