import { expect, test, _electron as electron, type ElectronApplication, type Page } from '@playwright/test'
import { createHash } from 'node:crypto'
import { deflateSync } from 'node:zlib'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'

function crc16Xmodem(value: string): string {
  let crc = 0
  for (const byte of Buffer.from(value, 'ascii')) {
    crc ^= byte << 8
    for (let bit = 0; bit < 8; bit += 1) crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

function buildRasterZpl(raw: Buffer, bytesPerRow: number): Buffer {
  const encoded = deflateSync(raw).toString('base64')
  return Buffer.from(
    `~DGR:PREVIEW.GRF,${raw.length},${bytesPerRow},:Z64:${encoded}:${crc16Xmodem(encoded)}` +
    '^XA^XGR:PREVIEW.GRF,1,1^FS^XZ',
    'ascii'
  )
}

test.describe('QA E2E - Origem OCR das Etiquetas', () => {
  let app: ElectronApplication
  let page: Page
  let tempDir: string
  let originalPath: string
  const runtimeErrors: string[] = []

  test.beforeAll(async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'razai-e2e-shopee-preview-'))
    const dbPath = join(tempDir, 'razai-test.sqlite')
    const userDataPath = join(tempDir, 'user-data')
    originalPath = join(userDataPath, 'shopee', 'etiquetas', 'batch-preview', 'originais', 'fixture-preview.zpl')
    mkdirSync(dirname(originalPath), { recursive: true })
    app = await electron.launch({
      args: ['.'],
      env: {
        ...process.env,
        NODE_ENV: 'test',
        RAZAI_DB_PATH: dbPath,
        RAZAI_USER_DATA_PATH: userDataPath
      }
    })
    page = await app.firstWindow()
    page.on('pageerror', (error) => runtimeErrors.push(error.message))
    page.on('console', (message) => { if (message.type() === 'error') runtimeErrors.push(message.text()) })
    await page.waitForLoadState('domcontentloaded')

    const width = 128
    const height = 160
    const bytesPerRow = width / 8
    const raw = Buffer.alloc(bytesPerRow * height, 0)
    for (let y = 20; y < 56; y += 4) raw.fill(0xff, y * bytesPerRow, (y + 1) * bytesPerRow)
    for (let y = 70; y < 106; y += 4) raw.fill(0xaa, y * bytesPerRow, (y + 1) * bytesPerRow)
    const zpl = buildRasterZpl(raw, bytesPerRow)
    writeFileSync(originalPath, zpl)
    const now = new Date().toISOString()
    const expiresAt = new Date(Date.now() + 86_400_000).toISOString()
    const documentHash = createHash('sha256').update(zpl).digest('hex')
    const rasterHash = createHash('sha256').update(raw).digest('hex')
    await app.evaluate(async (_electron, fixture) => {
      const createRequire = process.getBuiltinModule('node:module').createRequire
      const Database = createRequire(`${process.cwd()}/package.json`)('better-sqlite3') as typeof import('better-sqlite3')
      const db = new Database(fixture.dbPath)
      db.pragma('foreign_keys = ON')
      db.prepare(`INSERT INTO shopee_etiqueta_lotes
        (id, status, progress, expires_at, created_at, updated_at) VALUES (?, 'revisao', 75, ?, ?, ?)`)
        .run('batch-preview', fixture.expiresAt, fixture.now, fixture.now)
      db.prepare(`INSERT INTO shopee_etiqueta_arquivos
        (id, lote_id, original_name, stored_path, source_hash, byte_size, source_order, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, 0, ?)`)
        .run('file-preview', 'batch-preview', 'fixture-preview.zpl', fixture.originalPath, fixture.documentHash, fixture.byteSize, fixture.expiresAt)
      db.prepare(`INSERT INTO shopee_etiqueta_documentos
        (id, arquivo_id, entry_name, document_hash, byte_size, document_order)
        VALUES (?, ?, ?, ?, ?, 0)`)
        .run('document-preview', 'file-preview', 'fixture-preview.zpl', fixture.documentHash, fixture.byteSize)
      db.prepare(`INSERT INTO shopee_etiqueta_paginas
        (id, documento_id, page_order, page_type, order_id, package_number, extraction_method, confidence,
         raster_hash, rotation_degrees, image_width, image_height, warnings_json)
        VALUES (?, ?, 0, 'checklist', 'ORDER-PREVIEW', 1, 'z64', 72, ?, 0, ?, ?, '[]')`)
        .run('page-preview', 'document-preview', fixture.rasterHash, fixture.width, fixture.height)
      const insertItem = db.prepare(`INSERT INTO shopee_etiqueta_itens
        (id, pagina_id, row_order, order_id, product_raw, variation_raw, fabric_raw, color_raw,
         quantity, sku, fabric_name, color_name, cut_mm, width_mm, confidence, review_required,
         source_x, source_y, source_width, source_height)
        VALUES (?, 'page-preview', ?, 'ORDER-PREVIEW', ?, ?, 'Tecido', ?, 1, ?, 'HELANCA', ?, ?, 1800, 72, 1, 10, ?, 108, 36)`)
      insertItem.run('item-preview-1', 0, 'Tecido Malha Helanca', 'Branco, 4m x 1,80m', 'Branco', 'SKU-BRANCO', 'Branco', 4000, 20)
      insertItem.run('item-preview-2', 1, 'Tecido Malha Helanca', 'Preto, 2m x 1,80m', 'Preto', 'SKU-PRETO', 'Preto', 2000, 70)
      db.prepare(`UPDATE shopee_etiqueta_itens SET
        ocr_product_raw = product_raw, ocr_variation_raw = variation_raw, ocr_quantity_raw = '1',
        ocr_sku_raw = CASE WHEN id = 'item-preview-1' THEN 'ISKU-BRANC0' ELSE sku END,
        ocr_confidence = confidence, validation_source = 'ocr',
        review_reason = 'Leitura inédita com baixa qualidade; confirme os dados.'
      `).run()
      db.close()
    }, { dbPath, originalPath, documentHash, rasterHash, byteSize: zpl.length, expiresAt, now, width, height })

    await page.setViewportSize({ width: 1659, height: 635 })
    await page.locator('.nav-item', { hasText: 'Shopee' }).click()
    await page.locator('.subnav-item', { hasText: 'Etiquetas' }).click()
    await expect(page.locator('.review-item')).toHaveCount(2)
  })

  test.afterAll(async () => {
    await app?.close()
    if (tempDir) rmSync(tempDir, { recursive: true, force: true })
  })

  test('mostra a etiqueta inteira e destaca a linha correta sem expor o arquivo local', async () => {
    const buttons = page.getByRole('button', { name: 'Ver origem' })
    const firstButton = buttons.nth(0)
    await firstButton.click()
    const dialog = page.getByRole('dialog', { name: 'ORIGEM DA LEITURA OCR' })
    await expect(dialog).toBeVisible()
    await expect(dialog.locator('.source-image')).toBeVisible()
    const firstHighlight = await dialog.locator('.source-highlight').evaluate((rect) => ({
      x: Number(rect.getAttribute('x')),
      y: Number(rect.getAttribute('y')),
      width: Number(rect.getAttribute('width')),
      height: Number(rect.getAttribute('height'))
    }))
    expect(firstHighlight).toEqual({ x: 10, y: 20, width: 108, height: 36 })
    expect(firstHighlight.x + firstHighlight.width).toBeLessThanOrEqual(128)
    expect(firstHighlight.y + firstHighlight.height).toBeLessThanOrEqual(160)

    const apiResult = await page.evaluate(() => window.razai.shopee.etiquetas.getItemSourcePreview('item-preview-1'))
    expect(Object.keys(apiResult)).not.toContain('storedPath')
    expect(JSON.stringify(apiResult)).not.toContain('fixture-preview.zpl^XA')

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(firstButton).toBeFocused()

    await buttons.nth(1).click()
    const secondY = Number(await page.locator('.source-highlight').getAttribute('y'))
    expect(secondY).toBe(70)
    expect(secondY).not.toBe(firstHighlight.y)
    await expect(page.getByText(/% OCR/)).toHaveCount(0)
    await expect(page.getByText('REVISÃO NECESSÁRIA')).toHaveCount(2)

    await page.setViewportSize({ width: 900, height: 720 })
    const bounds = await dialog.evaluate((element) => {
      const box = element.getBoundingClientRect()
      return { left: box.left, top: box.top, right: box.right, bottom: box.bottom }
    })
    expect(bounds.left).toBeGreaterThanOrEqual(0)
    expect(bounds.top).toBeGreaterThanOrEqual(0)
    expect(bounds.right).toBeLessThanOrEqual(900)
    expect(bounds.bottom).toBeLessThanOrEqual(720)

    await page.keyboard.press('Escape')
    await page.locator('.review-item').first().getByRole('button', { name: 'Salvar correção' }).click()
    await expect(page.locator('.review-item')).toHaveCount(1)
    await expect(page.getByText(/CORREÇÕES EXATAS 1/)).toBeVisible()
    await expect(page.getByText(/AMOSTRAS 1/)).toBeVisible()

    const learning = await app.evaluate(async (_electron, fixture) => {
      const createRequire = process.getBuiltinModule('node:module').createRequire
      const Database = createRequire(`${process.cwd()}/package.json`)('better-sqlite3') as typeof import('better-sqlite3')
      const db = new Database(fixture.dbPath)
      const item = db.prepare(`SELECT confidence, ocr_confidence, validation_source, review_required
        FROM shopee_etiqueta_itens WHERE id = 'item-preview-1'`).get() as Record<string, unknown>
      const memory = db.prepare('SELECT COUNT(*) AS total FROM shopee_etiqueta_correcoes_memoria').get() as { total: number }
      const sample = db.prepare('SELECT relative_path FROM shopee_etiqueta_amostras_ocr LIMIT 1').get() as { relative_path: string }
      db.close()
      return { item, memory: memory.total, relativePath: sample.relative_path }
    }, { dbPath: join(tempDir, 'razai-test.sqlite') })
    expect(learning.item).toMatchObject({ confidence: 72, ocr_confidence: 72, validation_source: 'manual', review_required: 0 })
    expect(learning.memory).toBe(1)
    const trainingSamplePath = join(tempDir, 'user-data', 'shopee', 'etiquetas', 'treinamento', learning.relativePath)
    expect(existsSync(trainingSamplePath)).toBe(true)

    await page.getByRole('button', { name: 'Excluir lote' }).click()
    const deleteDialog = page.getByRole('alertdialog', { name: 'EXCLUIR LOTE' })
    await expect(deleteDialog).toBeVisible()
    await expect(deleteDialog.getByText('Equivalências e configuração da Zebra serão preservadas.')).toBeVisible()
    await expect(deleteDialog.getByRole('button', { name: 'Cancelar' })).toBeFocused()
    await deleteDialog.getByRole('button', { name: 'Excluir lote' }).click()
    await expect(deleteDialog).toBeHidden()
    await expect(page.locator('.review-item')).toHaveCount(0)
    await expect(page.getByText('Nenhum lote processado.')).toBeVisible()
    expect(existsSync(originalPath)).toBe(false)
    expect(existsSync(trainingSamplePath)).toBe(false)
    const learningAfterDelete = await page.evaluate(() => window.razai.shopee.etiquetas.getLearningStats())
    expect(learningAfterDelete).toEqual({ exactCorrections: 0, trainingSamples: 0, skuEquivalences: 1 })
    expect(runtimeErrors).toEqual([])
  })

  test('reimporta documento idêntico usando a correção exata sem nova revisão', async () => {
    const zplPath = join(tempDir, 'memory-reimport.zpl')
    const zpl = Buffer.from(
      '^XA^FDDESTINATARIO: TESTE^FS^FDPEDIDO: ORDER-MEMORY^FS^XZ' +
      '^XA^FDCHECKLIST^FS^FDPEDIDO: ORDER-MEMORY^FS^FDPACKAGE: 1^FS' +
      '^FDProduto: Tecido Malha Helanca 1,80m^FS^FDVariacao: Branco, 4m x 1,80m^FS' +
      '^FDQnt: 1^FS^FDSKU: OCR-ERRADO^FS^XZ',
      'utf8'
    )
    writeFileSync(zplPath, zpl)
    const documentHash = createHash('sha256').update(zpl).digest('hex')
    await app.evaluate(async (_electron, fixture) => {
      const createRequire = process.getBuiltinModule('node:module').createRequire
      const Database = createRequire(`${process.cwd()}/package.json`)('better-sqlite3') as typeof import('better-sqlite3')
      const db = new Database(fixture.dbPath)
      const now = new Date().toISOString()
      db.prepare(`INSERT INTO shopee_etiqueta_correcoes_memoria
        (id, document_hash, page_order, row_order, order_id, product_raw, variation_raw,
         fabric_name, color_name, cut_mm, width_mm, quantity, sku, created_at, updated_at)
        VALUES ('memory-e2e', ?, 1, 0, 'ORDER-MEMORY', 'Produto confirmado',
          'Azul Royal, 3m x 1,80m', 'HELANCA', 'Azul Royal', 3000, 1800, 1,
          'HELA-AZUL-01', ?, ?)`)
        .run(fixture.documentHash, now, now)
      db.close()
    }, { dbPath: join(tempDir, 'razai-test.sqlite'), documentHash })

    await page.locator('input[type="file"]').setInputFiles(zplPath)
    await expect(page.getByText('MEMÓRIA 1')).toBeVisible({ timeout: 15_000 })
    const detail = await page.evaluate(async () => {
      const batches = await window.razai.shopee.etiquetas.listBatches()
      return window.razai.shopee.etiquetas.getBatch(batches[0].id)
    })
    expect(detail?.reviewCount).toBe(0)
    expect(detail?.status).toBe('impressao_pendente')
    expect(detail?.items[0]).toMatchObject({
      sku: 'HELA-AZUL-01', colorName: 'Azul Royal', cutMm: 3000,
      validationSource: 'exact_memory', reviewRequired: false
    })
    expect(detail?.items[0].confidence).toBe(100)
    expect(runtimeErrors).toEqual([])
  })
})
