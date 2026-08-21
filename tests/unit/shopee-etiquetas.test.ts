import { afterEach, describe, expect, it, vi } from 'vitest'
import { deflateSync } from 'node:zlib'
import { createHash } from 'node:crypto'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import sharp from 'sharp'
import { parseZpl, zplInternals } from '../../src/main/services/shopee-etiquetas/zpl-parser'
import { normalizeChecklistItem, formatMeters, normalizeSku, resolveKnownSku } from '../../src/main/services/shopee-etiquetas/normalizer'
import { loadExactZplDocument, loadZplDocuments } from '../../src/main/services/shopee-etiquetas/document-loader'
import { CutPdfService } from '../../src/main/services/shopee-etiquetas/cut-pdf.service'
import { clipSourceBounds, extractorInternals } from '../../src/main/services/shopee-etiquetas/extractor'
import { sourcePreviewInternals, ShopeeEtiquetaSourcePreviewService } from '../../src/main/services/shopee-etiquetas/source-preview.service'
import { fullPageReviewBounds, ShopeeEtiquetasRepository } from '../../src/main/services/shopee-etiquetas/repository'
import { applyExactCorrection, canDeleteShopeeBatch, canRetryShopeePrinting, resolveShopeeBatchDirectory } from '../../src/main/services/shopee-etiquetas/job.service'
import { resolveTrainingSamplePath } from '../../src/main/services/shopee-etiquetas/training-sample.service'
import type { ShopeeEtiquetaItem } from '../../src/shared/shopee-etiquetas'

const temporaryPaths: string[] = []

function z64(raw: Buffer): string {
  const encoded = deflateSync(raw).toString('base64')
  const crc = zplInternals.crc16Xmodem(encoded).toString(16).toUpperCase().padStart(4, '0')
  return `:Z64:${encoded}:${crc}`
}

afterEach(async () => {
  vi.restoreAllMocks()
  await Promise.all(temporaryPaths.splice(0).map((target) => fs.rm(target, { recursive: true, force: true })))
})

describe('Shopee Etiquetas - parser e normalização', () => {
  it('conta somente páginas ^XG e associa corretamente gráficos que reutilizam o mesmo nome', () => {
    const first = Buffer.from([0xff, 0x00])
    const second = Buffer.from([0x0f, 0xf0])
    const document = Buffer.from(
      `~DGR:DEMO.GRF,2,1,${z64(first)}^XA^XGR:DEMO.GRF,1,1^FS^XZ` +
      '^XA^IDR:DEMO.GRF^FS^XZ' +
      `~DGR:DEMO.GRF,2,1,${z64(second)}^XA^XGR:DEMO.GRF,1,1^FS^XZ` +
      '^XA^IDR:DEMO.GRF^FS^XZ',
      'ascii'
    )
    const parsed = parseZpl(document)
    expect(parsed.pages).toHaveLength(2)
    expect(parsed.pages[0].graphic?.data).toEqual(first)
    expect(parsed.pages[1].graphic?.data).toEqual(second)
    expect(parsed.pages[0].graphic?.hash).not.toBe(parsed.pages[1].graphic?.hash)
  })

  it('extrai ^FD e interpreta escapes ^FH sem contar bloco ^ID', () => {
    const parsed = parseZpl(Buffer.from(
      '^XA^FH_^FDProduto:_20Tecido_20Helanca^FS^FDQnt:_201^FS^XZ^XA^IDR:DEMO.GRF^FS^XZ',
      'latin1'
    ))
    expect(parsed.pages).toHaveLength(1)
    expect(parsed.pages[0].text).toContain('Produto: Tecido Helanca')
    expect(parsed.pages[0].text).toContain('Qnt: 1')
  })

  it('normaliza dimensões em milímetros e mantém quantidade individual', () => {
    const item = normalizeChecklistItem(
      'Tecido Malha Helanca 1,80 m 100% Poliéster',
      'Branco Clássico, 4m x 1,80m',
      3,
      'HELA-BRAN-01',
      (kind, key) => kind === 'cor' && key === 'BRANCO CLASSICO' ? 'Branco' : null
    )
    expect(item.fabricName).toBe('HELANCA')
    expect(item.colorName).toBe('Branco')
    expect(item.cutMm).toBe(4000)
    expect(item.widthMm).toBe(1800)
    expect(item.quantity).toBe(3)
    expect(formatMeters(item.cutMm!)).toBe('4m')
  })

  it('resolve aliases e confusões de SKU apenas quando há um candidato canônico único', () => {
    expect(normalizeSku(' hela bran-o1 ')).toBe('HELABRAN-O1')
    expect(resolveKnownSku('IHELA-BRAN-01', ['HELA-BRAN-01'])).toEqual({
      sku: 'HELA-BRAN-01', source: 'safe_rule', ambiguous: false
    })
    expect(resolveKnownSku('HELA-BRAN-O1', ['HELA-BRAN-01'])).toEqual({
      sku: 'HELA-BRAN-01', source: 'safe_rule', ambiguous: false
    })
    expect(resolveKnownSku('HELA-BRAN-O1', ['HELA-BRAN-O1', 'HELA-BRAN-01'])).toEqual({
      sku: 'HELA-BRAN-O1', source: 'ocr', ambiguous: true
    })
    expect(resolveKnownSku('LIDO-ERRADO', [], 'SKU-CANONICO')).toEqual({
      sku: 'SKU-CANONICO', source: 'equivalence', ambiguous: false
    })
  })

  it('mantém confiança baixa somente como revisão para leitura inédita', () => {
    const item = normalizeChecklistItem(
      'Tecido Malha Helanca 1,80m', 'Branco, 4m x 1,80m', '1', 'HELA-BRAN-O1', () => null,
      (raw) => resolveKnownSku(raw, ['HELA-BRAN-01'])
    )
    expect(item).toMatchObject({ sku: 'HELA-BRAN-01', validationSource: 'safe_rule', reviewRequired: false })
  })

  it('preserva exatamente os bytes de um ZPL original carregado', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'razai-shopee-zpl-'))
    temporaryPaths.push(dir)
    const filePath = path.join(dir, 'original.zpl')
    const original = Buffer.from('^XA\r\n^FO1,1^FDÁÇÃO^FS\r\n^XZ', 'latin1')
    await fs.writeFile(filePath, original)
    const [loaded] = await loadZplDocuments(filePath)
    expect(Buffer.compare(loaded.buffer, original)).toBe(0)
  })

  it('recusa o documento quando os bytes originais não correspondem ao hash persistido', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'razai-shopee-hash-'))
    temporaryPaths.push(dir)
    const filePath = path.join(dir, 'original.zpl')
    await fs.writeFile(filePath, '^XA^FDORIGINAL^FS^XZ', 'latin1')
    await expect(loadExactZplDocument(filePath, 'original.zpl', 'hash-incorreto'))
      .rejects.toThrow('alterado desde a importação')
  })
})

describe('Shopee Etiquetas - origem da leitura OCR', () => {
  it('destaca a checklist inteira para uma linha de revisão criada manualmente', () => {
    expect(fullPageReviewBounds(128, 160)).toEqual({ x: 4, y: 4, width: 120, height: 152 })
    expect(fullPageReviewBounds(4, 3)).toEqual({ x: 1, y: 1, width: 2, height: 1 })
    expect(fullPageReviewBounds(null, 160)).toBeNull()
  })

  it('aplica margem e limita o retângulo às dimensões da imagem', () => {
    expect(clipSourceBounds({ x0: 3, y0: 4, x1: 98, y1: 49 }, 100, 50, 8)).toEqual({
      x: 0, y: 0, width: 100, height: 50
    })
    expect(() => sourcePreviewInternals.assertBounds({ x: 90, y: 10, width: 20, height: 10 }, 100, 50))
      .toThrow('não corresponde às dimensões')
  })

  it('associa a faixa completa da tabela à linha extraída do TSV', () => {
    const word = (left: number, top: number, width: number, text: string) =>
      `5\t1\t1\t1\t1\t1\t${left}\t${top}\t${width}\t20\t90\t${text}`
    const tsv = [
      'level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext',
      word(10, 10, 100, 'PRODUTO'), word(300, 10, 100, 'VARIAÇÃO'), word(600, 10, 50, 'QNT'), word(700, 10, 60, 'SKU'),
      word(10, 100, 200, 'Tecido Malha Helanca'), word(300, 100, 250, 'Branco, 4m x 1,80m'),
      word(610, 100, 20, '1'), word(710, 100, 100, 'HELA-BRAN-01')
    ].join('\n')
    const [item] = extractorInternals.extractRows({ text: '', tsv, confidence: 90 }, 900, 300, () => null)
    expect(item.sourceBounds).toEqual({ x: 2, y: 12, width: 816, height: 226 })
    expect(item).toMatchObject({ productRaw: 'Tecido Malha Helanca', variationRaw: 'Branco, 4m x 1,80m', sku: 'HELA-BRAN-01' })
  })

  it('extrai o pedido do cabeçalho por posição mesmo quando o OCR separa o identificador', () => {
    const word = (left: number, top: number, width: number, text: string) =>
      `5\t1\t1\t1\t1\t1\t${left}\t${top}\t${width}\t20\t90\t${text}`
    const tsv = [
      'level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext',
      word(100, 150, 30, 'ID'), word(135, 150, 70, 'Pedido'),
      word(220, 150, 110, '2608210'), word(334, 150, 110, 'GX79K8Q'),
      word(450, 150, 90, 'package'), word(545, 150, 15, '1')
    ].join('\n')
    expect(extractorInternals.extractOrderIdFromOcr({ text: 'Checklist de carregamento', tsv, confidence: 90 }, 700))
      .toBe('2608210GX79K8Q')
  })

  it('usa o identificador anterior a package quando o rótulo Pedido não é reconhecido', () => {
    const tsv = [
      'level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext',
      '5\t1\t1\t1\t1\t1\t220\t150\t220\t20\t82\t2608210GX79K8Q',
      '5\t1\t1\t1\t1\t2\t450\t150\t90\t20\t88\tpackage',
      '5\t1\t1\t1\t1\t3\t545\t150\t15\t20\t91\t1'
    ].join('\n')
    expect(extractorInternals.extractOrderIdFromOcr({ text: '', tsv, confidence: 82 }, 700))
      .toBe('2608210GX79K8Q')
  })

  it('mantém revisão para regra heurística quando a leitura bruta está abaixo do limite', () => {
    const word = (left: number, text: string) =>
      `5\t1\t1\t1\t1\t1\t${left}\t100\t100\t20\t60\t${text}`
    const tsv = [
      'level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext',
      `5\t1\t1\t1\t1\t1\t10\t10\t100\t20\t60\tPRODUTO`,
      `5\t1\t1\t1\t1\t1\t300\t10\t100\t20\t60\tVARIAÇÃO`,
      `5\t1\t1\t1\t1\t1\t600\t10\t50\t20\t60\tQNT`,
      `5\t1\t1\t1\t1\t1\t700\t10\t60\t20\t60\tSKU`,
      word(10, 'Tecido Malha Helanca'), word(300, 'Branco, 4m x 1,80m'), word(610, '1'), word(710, 'HELA-BRAN-O1')
    ].join('\n')
    const [item] = extractorInternals.extractRows(
      { text: '', tsv, confidence: 60 }, 900, 300, () => null,
      (raw) => resolveKnownSku(raw, ['HELA-BRAN-01'])
    )
    expect(item).toMatchObject({ sku: 'HELA-BRAN-01', validationSource: 'safe_rule', reviewRequired: true })
  })

  it('reconstrói a página correta, aplica a rotação salva e não retorna caminhos ou ZPL', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'razai-shopee-preview-'))
    temporaryPaths.push(dir)
    const originalPath = path.join(dir, 'preview.zpl')
    const firstRaw = Buffer.alloc(16, 0xff)
    const secondRaw = Buffer.from(Array.from({ length: 16 }, (_, index) => index % 2 ? 0xaa : 0x55))
    const document = Buffer.from(
      `~DGR:FIRST.GRF,16,2,${z64(firstRaw)}^XA^XGR:FIRST.GRF,1,1^FS^XZ` +
      `~DGR:SECOND.GRF,16,2,${z64(secondRaw)}^XA^XGR:SECOND.GRF,1,1^FS^XZ`,
      'ascii'
    )
    await fs.writeFile(originalPath, document)
    const documentHash = createHash('sha256').update(document).digest('hex')
    const parsed = parseZpl(document)
    const source = {
      documentId: 'document-preview', storedPath: originalPath, entryName: 'preview.zpl', documentHash,
      pageOrder: 1, method: 'z64', rasterHash: parsed.pages[1].graphic!.hash, rotationDegrees: 90,
      imageWidth: 8, imageHeight: 16, sourceX: 1, sourceY: 2, sourceWidth: 5, sourceHeight: 10
    }
    vi.spyOn(ShopeeEtiquetasRepository, 'getItemPreviewSource').mockReturnValue(source)

    const preview = await ShopeeEtiquetaSourcePreviewService.getItemSourcePreview('item-preview')
    const metadata = await sharp(Buffer.from(preview.imageBase64, 'base64')).metadata()
    expect(preview).toMatchObject({ width: 8, height: 16, pageNumber: 2, entryName: 'preview.zpl' })
    expect(preview.highlight).toEqual({ x: 1, y: 2, width: 5, height: 10 })
    expect(metadata).toMatchObject({ width: 8, height: 16, format: 'png' })
    expect(Object.keys(preview)).not.toContain('storedPath')
    expect(JSON.stringify(preview)).not.toContain('^XA')

    vi.mocked(ShopeeEtiquetasRepository.getItemPreviewSource).mockReturnValue({ ...source, method: 'fd' })
    await expect(ShopeeEtiquetaSourcePreviewService.getItemSourcePreview('item-preview')).rejects.toThrow('origem textual')

    vi.mocked(ShopeeEtiquetasRepository.getItemPreviewSource).mockReturnValue({ ...source, sourceX: null })
    await expect(ShopeeEtiquetaSourcePreviewService.getItemSourcePreview('item-preview')).rejects.toThrow('Reimporte o lote')

    vi.mocked(ShopeeEtiquetasRepository.getItemPreviewSource).mockReturnValue({ ...source, storedPath: null })
    await expect(ShopeeEtiquetaSourcePreviewService.getItemSourcePreview('item-preview')).rejects.toThrow('expirou')
  })
})

describe('Shopee Etiquetas - amostras locais de treinamento', () => {
  it('resolve somente hashes SHA-256 dentro do diretório controlado', () => {
    const hash = 'a'.repeat(64)
    const sample = resolveTrainingSamplePath('C:\\app-data', hash)
    expect(sample.absolutePath).toBe(path.resolve('C:\\app-data', 'shopee', 'etiquetas', 'treinamento', 'amostras', `${hash}.png`))
    expect(sample.relativePath).toBe(path.join('amostras', `${hash}.png`))
    expect(() => resolveTrainingSamplePath('C:\\app-data', '..\\amostra')).toThrow('Hash de amostra inválido')
  })
})

describe('Shopee Etiquetas - exclusão segura de lotes', () => {
  it('permite somente lotes não processados, em revisão ou falhos sem impressão aceita', () => {
    expect(canDeleteShopeeBatch('recebido', [])).toBe(true)
    expect(canDeleteShopeeBatch('revisao', ['pendente'])).toBe(true)
    expect(canDeleteShopeeBatch('falhou', ['falhou'])).toBe(true)
    expect(canDeleteShopeeBatch('extraindo', ['pendente'])).toBe(false)
    expect(canDeleteShopeeBatch('revisao', ['impresso'])).toBe(false)
    expect(canDeleteShopeeBatch('impressao_incerta', ['pendente'])).toBe(false)
    expect(canDeleteShopeeBatch('concluido', ['impresso'])).toBe(false)
  })

  it('bloqueia reimpressão fora dos estados permitidos ou com revisão pendente', () => {
    expect(canRetryShopeePrinting('impressao_pendente', 0)).toBe(true)
    expect(canRetryShopeePrinting('impressao_incerta', 0)).toBe(true)
    expect(canRetryShopeePrinting('revisao', 0)).toBe(false)
    expect(canRetryShopeePrinting('impressao_pendente', 1)).toBe(false)
    expect(canRetryShopeePrinting('concluido', 0)).toBe(false)
  })

  it('resolve a pasta somente para identificadores contidos na raiz do módulo', () => {
    expect(resolveShopeeBatchDirectory('C:\\app-data', 'batch-123')).toBe(path.resolve('C:\\app-data', 'shopee', 'etiquetas', 'batch-123'))
    expect(() => resolveShopeeBatchDirectory('C:\\app-data', '..\\outro-modulo')).toThrow('Identificador de lote inválido')
  })
})

describe('Shopee Etiquetas - memória de correções', () => {
  it('reutiliza todos os campos confirmados sem alterar a confiança bruta do OCR', () => {
    const extracted = {
      productRaw: 'OCR produto', variationRaw: 'OCR variação', fabricRaw: 'OCR produto', colorRaw: 'OCR cor',
      quantity: 1, quantityRaw: '1', sku: 'IHELA-BRANC0', skuRaw: 'IHELA-BRANC0', fabricName: 'HELANCA',
      colorName: 'Branco', cutMm: 4000, widthMm: 1800, confidence: 73, validationSource: 'ocr' as const,
      reviewReason: 'Leitura inédita com baixa qualidade; confirme os dados.', reviewRequired: true, sourceBounds: null
    }
    const result = applyExactCorrection(extracted, {
      id: 'memory-1', orderId: 'ORDER-1', productRaw: 'Produto confirmado', variationRaw: 'Branco, 4m x 1,80m',
      fabricName: 'HELANCA', colorName: 'Branco', cutMm: 4000, widthMm: 1800, quantity: 1, sku: 'HELA-BRAN-01'
    }, null)
    expect(result.orderId).toBe('ORDER-1')
    expect(result.item).toMatchObject({
      sku: 'HELA-BRAN-01', confidence: 73, validationSource: 'exact_memory', reviewRequired: false, reviewReason: null
    })
    expect(result.item.skuRaw).toBe('IHELA-BRANC0')
  })
})

describe('Shopee Etiquetas - mapa de cortes', () => {
  const item = (overrides: Partial<ShopeeEtiquetaItem>): ShopeeEtiquetaItem => ({
    id: crypto.randomUUID(), paginaId: 'page', rowOrder: 0, orderId: 'ORDER-1', productRaw: 'Produto',
    variationRaw: 'Variação', fabricRaw: 'Tecido', colorRaw: 'Cor', quantity: 1, sku: 'SKU-1',
    fabricName: 'HELANCA', colorName: 'Branco', cutMm: 1000, widthMm: 1800,
    confidence: 100, validationSource: 'ocr', reviewReason: null, reviewRequired: false, sourcePreviewAvailable: false,
    sourcePreviewUnavailableReason: 'text_source', ...overrides
  })

  it('agrupa por tecido/cor, ordena cortes e repete cada unidade sem total acumulado', () => {
    const html = CutPdfService.generateHtml('batch-12345678', [
      item({ cutMm: 2000 }), item({ cutMm: 4000, quantity: 2 }), item({ colorName: 'Preto', cutMm: 1500 })
    ], new Date('2026-08-20T12:00:00-03:00'))
    expect(html).toContain('RAZAI / SISTEMA')
    expect(html).toContain('Mapa de Cortes / Shopee')
    expect(html).toContain('4m &bull; 4m &bull; 2m')
    expect(html).toContain('1,5m')
    expect(html).not.toContain('SKU-1')
    expect(html).not.toContain('ORDER-1')
    expect(html).not.toContain('Total de')
  })
})
