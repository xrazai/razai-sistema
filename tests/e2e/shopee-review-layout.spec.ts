import { expect, test, _electron as electron, type ElectronApplication, type Page } from '@playwright/test'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'

test.describe('QA E2E - Layout da revisão de Etiquetas', () => {
  let app: ElectronApplication
  let page: Page
  let tempDir: string
  let fixturePath: string
  const runtimeErrors: string[] = []

  test.beforeAll(async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'razai-e2e-shopee-review-'))
    fixturePath = join(tempDir, 'fixture-revisao.zpl')
    const checklist = (packageNumber: number, color: string) =>
      `^XA^FDChecklist de carregamento^FS^FDID Pedido: TESTORDER123^FS^FDPACKAGE: ${packageNumber}^FS` +
      '^FDProduto: Tecido Malha Helanca 1,80m 100% Poliester^FS' +
      `^FDVariacao: ${color}, ${packageNumber}m x 1,80m^FS^FDQnt: 1^FS^XZ`
    writeFileSync(
      fixturePath,
      '^XA^FDDESTINATARIO^FS^FDPedido: TESTORDER123^FS^XZ' +
      checklist(1, 'Branco') + checklist(2, 'Preto') + checklist(3, 'Azul Royal'),
      'latin1'
    )

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
    page.on('pageerror', (error) => runtimeErrors.push(error.message))
    page.on('console', (message) => { if (message.type() === 'error') runtimeErrors.push(message.text()) })
    await page.waitForLoadState('domcontentloaded')
  })

  test.afterAll(async () => {
    await app?.close()
    if (tempDir) rmSync(tempDir, { recursive: true, force: true })
  })

  async function openReviewAt(width: number, height: number) {
    await page.setViewportSize({ width, height })
    await page.locator('.nav-item', { hasText: 'Shopee' }).click()
    await page.locator('.subnav-item', { hasText: 'Etiquetas' }).click()
    await page.locator('input[type="file"]').setInputFiles(fixturePath)
    await expect(page.getByText(/^revisao$/i).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('.review-item')).toHaveCount(3)
  }

  async function layoutMetrics() {
    return page.locator('.etiquetas-content').evaluate((content) => {
      const panels = [...content.querySelectorAll<HTMLElement>(':scope > section.panel')]
      const panelByTitle = (title: string) => panels.find((panel) => panel.querySelector('.head .title')?.textContent?.trim() === title)
      const review = panelByTitle('Revisão obrigatória')
      const history = content.querySelector<HTMLElement>('.secondary-grid section.panel:first-child')
      const equivalences = content.querySelector<HTMLElement>('.secondary-grid section.panel:last-child')
      const lastReviewItem = review?.querySelector<HTMLElement>('.review-item:last-child')
      if (!review || !history || !equivalences || !lastReviewItem) throw new Error('Painéis esperados não encontrados.')
      const reviewBox = review.getBoundingClientRect()
      const itemBox = lastReviewItem.getBoundingClientRect()
      const historyBox = history.getBoundingClientRect()
      const equivalenceBox = equivalences.getBoundingClientRect()
      return {
        reviewBottom: reviewBox.bottom,
        itemBottom: itemBox.bottom,
        historyTop: historyBox.top,
        historyBottom: historyBox.bottom,
        historyLeft: historyBox.left,
        equivalenceTop: equivalenceBox.top,
        equivalenceLeft: equivalenceBox.left,
        scrolls: content.scrollHeight > content.clientHeight
      }
    })
  }

  test('mantém revisão, histórico e equivalências separados no desktop baixo', async () => {
    await openReviewAt(1659, 635)
    await expect(page.locator('.main > header.topbar .title')).toHaveText(/Shopee \/ Etiquetas/i)
    await expect(page.locator('vite-error-overlay')).toHaveCount(0)
    const metrics = await layoutMetrics()
    expect(metrics.itemBottom).toBeLessThanOrEqual(metrics.reviewBottom)
    expect(metrics.reviewBottom).toBeLessThan(metrics.historyTop)
    expect(metrics.historyTop).toBe(metrics.equivalenceTop)
    expect(metrics.scrolls).toBe(true)
    expect(runtimeErrors).toEqual([])
  })

  test('empilha histórico e equivalências sem sobreposição abaixo de 960px', async () => {
    await page.setViewportSize({ width: 900, height: 720 })
    const metrics = await layoutMetrics()
    expect(metrics.itemBottom).toBeLessThanOrEqual(metrics.reviewBottom)
    expect(metrics.reviewBottom).toBeLessThan(metrics.historyTop)
    expect(metrics.historyBottom).toBeLessThan(metrics.equivalenceTop)
    expect(metrics.historyLeft).toBe(metrics.equivalenceLeft)
    expect(metrics.scrolls).toBe(true)
  })
})
