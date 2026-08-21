import { expect, test, _electron as electron, type ElectronApplication, type Page } from '@playwright/test'
import { createHash } from 'node:crypto'
import { deflateSync } from 'node:zlib'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'

function crc16Xmodem(value: string): string {
  let crc = 0
  for (const byte of Buffer.from(value, 'ascii')) {
    crc ^= byte << 8
    for (let bit = 0; bit < 8; bit += 1) crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

function rasterPage(name: string, raw: Buffer, bytesPerRow: number): string {
  const encoded = deflateSync(raw).toString('base64')
  return `~DGR:${name}.GRF,${raw.length},${bytesPerRow},:Z64:${encoded}:${crc16Xmodem(encoded)}` +
    `^XA^XGR:${name}.GRF,1,1^FS^XZ`
}

test.describe('QA E2E - Checklist Shopee sem linhas reconhecidas', () => {
  let app: ElectronApplication
  let page: Page
  let tempDir: string
  let dbPath: string
  const runtimeErrors: string[] = []

  test.beforeAll(async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'razai-e2e-shopee-empty-checklist-'))
    dbPath = join(tempDir, 'razai-test.sqlite')
    const userDataPath = join(tempDir, 'user-data')
    const originalPath = join(userDataPath, 'shopee', 'etiquetas', 'batch-empty-checklist', 'originais', 'fixture.zpl')
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
    const shippingRaw = Buffer.alloc(bytesPerRow * height, 0x11)
    const checklistRaw = Buffer.alloc(bytesPerRow * height, 0)
    for (let y = 24; y < 136; y += 16) checklistRaw.fill(0xff, y * bytesPerRow, (y + 2) * bytesPerRow)
    const zpl = Buffer.from(
      rasterPage('SHIPPING', shippingRaw, bytesPerRow) + rasterPage('CHECKLIST', checklistRaw, bytesPerRow),
      'ascii'
    )
    writeFileSync(originalPath, zpl)
    const now = new Date().toISOString()
    const expiresAt = new Date(Date.now() + 86_400_000).toISOString()
    const documentHash = createHash('sha256').update(zpl).digest('hex')
    const shippingHash = createHash('sha256').update(shippingRaw).digest('hex')
    const checklistHash = createHash('sha256').update(checklistRaw).digest('hex')

    await app.evaluate(async (_electron, fixture) => {
      const createRequire = process.getBuiltinModule('node:module').createRequire
      const Database = createRequire(`${process.cwd()}/package.json`)('better-sqlite3') as typeof import('better-sqlite3')
      const db = new Database(fixture.dbPath)
      db.pragma('foreign_keys = ON')
      db.prepare(`INSERT INTO shopee_etiqueta_lotes
        (id, status, progress, error_code, error_message, expires_at, created_at, updated_at)
        VALUES ('batch-empty-checklist', 'revisao', 80, 'REVIEW_REQUIRED',
          '3 pendência(s) precisam de revisão antes da impressão.', ?, ?, ?)`)
        .run(fixture.expiresAt, fixture.now, fixture.now)
      db.prepare(`INSERT INTO shopee_etiqueta_arquivos
        (id, lote_id, original_name, stored_path, source_hash, byte_size, source_order, expires_at)
        VALUES ('file-empty-checklist', 'batch-empty-checklist', 'fixture.zpl', ?, ?, ?, 0, ?)`)
        .run(fixture.originalPath, fixture.documentHash, fixture.byteSize, fixture.expiresAt)
      db.prepare(`INSERT INTO shopee_etiqueta_documentos
        (id, arquivo_id, entry_name, document_hash, byte_size, document_order)
        VALUES ('document-empty-checklist', 'file-empty-checklist', 'fixture.zpl', ?, ?, 0)`)
        .run(fixture.documentHash, fixture.byteSize)
      const insertPage = db.prepare(`INSERT INTO shopee_etiqueta_paginas
        (id, documento_id, page_order, page_type, order_id, package_number, extraction_method,
         confidence, raster_hash, rotation_degrees, image_width, image_height, warnings_json)
        VALUES (?, 'document-empty-checklist', ?, ?, 'ORDER-EMPTY', ?, 'z64', ?, ?, 0, ?, ?, ?)`)
      insertPage.run('page-shipping', 0, 'envio', null, 91, fixture.shippingHash, fixture.width, fixture.height, '[]')
      insertPage.run(
        'page-empty-checklist', 1, 'checklist', 1, 42, fixture.checklistHash,
        fixture.width, fixture.height, '["Nenhuma linha de produto foi reconhecida."]'
      )
      db.close()
    }, {
      dbPath,
      originalPath,
      documentHash,
      shippingHash,
      checklistHash,
      byteSize: zpl.length,
      expiresAt,
      now,
      width,
      height
    })

    await page.setViewportSize({ width: 1659, height: 635 })
    await page.locator('.nav-item', { hasText: 'Shopee' }).click()
    await page.locator('.subnav-item', { hasText: 'Etiquetas' }).click()
  })

  test.afterAll(async () => {
    await app?.close()
    if (tempDir) rmSync(tempDir, { recursive: true, force: true })
  })

  test('materializa a pendência, permite corrigir pela origem e retomar o lote', async () => {
    const review = page.locator('.review-item')
    await expect(review).toHaveCount(1)
    await expect(page.getByText('Checklist sem linhas reconhecidas. Abra a origem')).toBeVisible()
    await expect(page.getByText('1 pendência(s) precisam de revisão antes da impressão.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Retomar lote' })).toBeDisabled()

    await review.getByRole('button', { name: 'Ver origem' }).click()
    const dialog = page.getByRole('dialog', { name: 'ORIGEM DA LEITURA OCR' })
    await expect(dialog).toBeVisible()
    const highlight = await dialog.locator('.source-highlight').evaluate((rect) => ({
      x: Number(rect.getAttribute('x')),
      y: Number(rect.getAttribute('y')),
      width: Number(rect.getAttribute('width')),
      height: Number(rect.getAttribute('height'))
    }))
    expect(highlight).toEqual({ x: 4, y: 4, width: 120, height: 152 })
    await page.keyboard.press('Escape')

    const fill = async (label: string, value: string) => {
      await review.locator('.fields label', { hasText: label }).locator('input').fill(value)
    }
    await fill('Produto original', 'Tecido Malha Helanca 1,80m')
    await fill('Variação original', 'Branco, 4m x 1,80m')
    await fill('Tecido normalizado', 'HELANCA')
    await fill('Cor normalizada', 'Branco')
    await fill('Corte', '4')
    await fill('Largura', '1,8')
    await fill('Quantidade', '1')
    await fill('SKU', 'HELA-BRANCO-01')
    await review.getByRole('button', { name: 'Salvar correção' }).click()

    await expect(review).toHaveCount(0)
    await expect(page.locator('.batch-action-message')).toHaveText('Revisões concluídas. Clique em Retomar lote.')
    const resume = page.getByRole('button', { name: 'Retomar lote' })
    await expect(resume).toBeEnabled()
    await resume.click()
    await expect(page.locator('.batch-progress')).toContainText('Configure a impressora Zebra para concluir o lote.')
    await expect(page.locator('.submodule-toolbar .badge')).toHaveText('impressao_pendente')

    const persisted = await app.evaluate(async (_electron, fixture) => {
      const createRequire = process.getBuiltinModule('node:module').createRequire
      const Database = createRequire(`${process.cwd()}/package.json`)('better-sqlite3') as typeof import('better-sqlite3')
      const db = new Database(fixture.dbPath)
      const item = db.prepare(`SELECT order_id, sku, cut_mm, review_required
        FROM shopee_etiqueta_itens WHERE pagina_id = 'page-empty-checklist'`).get() as Record<string, unknown>
      const count = db.prepare(`SELECT COUNT(*) AS total
        FROM shopee_etiqueta_itens WHERE pagina_id = 'page-empty-checklist'`).get() as { total: number }
      db.close()
      return { item, count: count.total }
    }, { dbPath })
    expect(persisted.count).toBe(1)
    expect(persisted.item).toMatchObject({ order_id: 'ORDER-EMPTY', sku: 'HELA-BRANCO-01', cut_mm: 4000, review_required: 0 })
    expect(runtimeErrors).toEqual([])
  })
})
