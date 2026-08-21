import { expect, test, _electron as electron, type ElectronApplication, type Page } from '@playwright/test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { generateCutPdfHtml } from '../../src/main/services/shopee-etiquetas/cut-pdf-html'
import type { ShopeeEtiquetaItem } from '../../src/shared/shopee-etiquetas'

function fabricItems(fabricName: string, colorCount: number): ShopeeEtiquetaItem[] {
  return Array.from({ length: colorCount }, (_, index) => ({
    id: `${fabricName}-${index}`,
    paginaId: 'page',
    rowOrder: index,
    orderId: 'ORDER',
    productRaw: fabricName,
    variationRaw: `Cor ${index}`,
    fabricRaw: fabricName,
    colorRaw: `Cor ${String(index).padStart(2, '0')}`,
    quantity: 1,
    sku: `SKU-${index}`,
    fabricName,
    colorName: `Cor ${String(index).padStart(2, '0')}`,
    cutMm: 1000 + index * 100,
    widthMm: 1800,
    confidence: 100,
    reviewRequired: false,
    sourcePreviewAvailable: false,
    sourcePreviewUnavailableReason: 'text_source'
  }))
}

test.describe('QA E2E - Paginação do mapa de cortes Shopee', () => {
  let app: ElectronApplication
  let page: Page
  let tempDir: string

  test.beforeAll(async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'razai-e2e-shopee-pdf-'))
    app = await electron.launch({
      args: ['.'],
      env: {
        ...process.env,
        NODE_ENV: 'test',
        RAZAI_DB_PATH: join(tempDir, 'razai-test.sqlite'),
        RAZAI_USER_DATA_PATH: join(tempDir, 'user-data')
      }
    })
    page = await app.firstWindow()
  })

  test.afterAll(async () => {
    await app?.close()
    if (tempDir) rmSync(tempDir, { recursive: true, force: true })
  })

  test('encaixa tabelas inteiras por first-fit decrescente sem overflow', async () => {
    const pageErrors: string[] = []
    page.on('pageerror', (error) => pageErrors.push(error.message))
    const items = [
      ...fabricItems('Z MAIOR', 22),
      ...fabricItems('M MEDIA', 12),
      ...fabricItems('A PEQUENA', 5)
    ]

    const html = generateCutPdfHtml('layout-test', items, new Date('2026-08-20T12:00:00-03:00'))
    await page.goto(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
    expect(pageErrors).toEqual([])
    await expect(page.locator('html')).toHaveAttribute('data-pdf-layout', 'ready')
    await expect(page.locator('.pdf-page')).toHaveCount(2)

    const pageTexts = await page.locator('.pdf-page').allTextContents()
    expect(pageTexts[0]).toContain('Z MAIOR')
    expect(pageTexts[0]).not.toContain('A PEQUENA')
    expect(pageTexts[0]).not.toContain('M MEDIA')
    expect(pageTexts[1]).toContain('M MEDIA')
    expect(pageTexts[1]).toContain('A PEQUENA')

    const layout = await page.locator('.page-content').evaluateAll((contents) => contents.map((content) => ({
      tables: content.querySelectorAll('.fabric-section').length,
      fits: content.scrollHeight <= content.clientHeight + 1
    })))
    expect(layout).toEqual([
      { tables: 1, fits: true },
      { tables: 2, fits: true }
    ])
    await expect(page.locator('.fabric-section')).toHaveCount(3)

    const typography = await page.locator('.fabric-section').first().evaluate((section) => {
      const header = section.querySelector('th')
      const value = section.querySelector('tbody td')
      const row = section.querySelector('tbody tr')
      if (!header || !value || !row) throw new Error('Tabela incompleta')
      const headerStyle = getComputedStyle(header)
      const valueStyle = getComputedStyle(value)
      return {
        headerFontSize: Number.parseFloat(headerStyle.fontSize),
        valueFontSize: Number.parseFloat(valueStyle.fontSize),
        valueFontWeight: Number.parseInt(valueStyle.fontWeight, 10),
        valueTextTransform: valueStyle.textTransform,
        rowHeight: row.getBoundingClientRect().height
      }
    })
    expect(typography.valueFontSize).toBeGreaterThan(typography.headerFontSize)
    expect(typography.valueFontWeight).toBeGreaterThanOrEqual(700)
    expect(typography.valueTextTransform).toBe('uppercase')
    expect(typography.rowHeight).toBeGreaterThanOrEqual(34)
    await expect(page.locator('.brand').first()).toHaveText('RAZAI / SISTEMA')
    await expect(page.locator('.brand-block').first()).toHaveCSS('min-height', '31px')
    await expect(page.getByText('Engenharia e Gestão Têxtil Industrial')).toHaveCount(0)
  })

  test('reduz uma tabela maior que a área A4 para mantê-la inteira em uma página', async () => {
    const html = generateCutPdfHtml('oversized-test', fabricItems('TABELA EXTENSA', 80))
    await page.goto(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)

    await expect(page.locator('html')).toHaveAttribute('data-pdf-layout', 'ready')
    await expect(page.locator('.pdf-page')).toHaveCount(1)
    await expect(page.locator('.fabric-section')).toHaveAttribute('data-compacted', 'true')
    await expect(page.locator('tbody tr')).toHaveCount(80)
    expect(await page.locator('.page-content').evaluate((content) => content.scrollHeight <= content.clientHeight + 1)).toBe(true)
  })
})
