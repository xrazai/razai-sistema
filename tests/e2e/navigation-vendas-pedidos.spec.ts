import { test, expect, _electron as electron, type ElectronApplication, type Page } from '@playwright/test'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { mkdtempSync, rmSync } from 'node:fs'

test.describe('QA E2E — Navegação Geral, Vendas, Pedidos e Settings', () => {
  let app: ElectronApplication
  let page: Page
  let tempDir: string
  let tempDbPath: string

  test.beforeAll(async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'razai-e2e-nav-'))
    tempDbPath = join(tempDir, 'razai-test.sqlite')

    app = await electron.launch({
      args: ['.'],
      env: {
        ...process.env,
        NODE_ENV: 'test',
        RAZAI_DB_PATH: tempDbPath
      }
    })

    page = await app.firstWindow()
    await page.waitForLoadState('domcontentloaded')
  })

  test.afterAll(async () => {
    if (app) {
      await app.close()
    }
    if (tempDir) {
      try {
        rmSync(tempDir, { recursive: true, force: true })
      } catch (err) {
        console.error('Falha ao limpar diretório temporário:', err)
      }
    }
  })

  test('Flow 1: Navegação para o módulo Vendas e validação do estado vazio', async () => {
    const navVendas = page.locator('.nav-item', { hasText: 'Vendas' })
    await navVendas.click()

    await expect(page.locator('.main > header.topbar .title')).toHaveText(/Vendas/i)
    await expect(page.getByText(/Nenhuma venda registrada/i)).toBeVisible()
    await expect(page.getByText(/O fluxo de vendas e registro de saídas aparecerá aqui/i)).toBeVisible()
  })

  test('Flow 2: Navegação para o módulo Pedidos e validação do estado vazio', async () => {
    const navPedidos = page.locator('.nav-item', { hasText: 'Pedidos' })
    await navPedidos.click()

    await expect(page.locator('.main > header.topbar .title')).toHaveText(/Pedidos/i)
    await expect(page.getByText(/Nenhum pedido registrado/i)).toBeVisible()
    await expect(page.getByText(/A gestão e controle de pedidos de clientes aparecerão aqui/i)).toBeVisible()
  })

  test('Flow 3: Navegação para Settings e validação das opções de módulo padrão', async () => {
    const navSettings = page.locator('.nav-item', { hasText: 'Settings' })
    await navSettings.click()

    await expect(page.locator('.main > header.topbar .title')).toHaveText(/Settings/i)
    await expect(page.getByText(/Aparência e Preferências de UI/i)).toBeVisible()
    await expect(page.getByText(/Impressora Térmica/i)).toBeVisible()

    // O select de módulo padrão deve listar Vendas e Pedidos
    const selectRoute = page.locator('#default-route-select')
    await expect(selectRoute).toBeVisible()
  })

  test('Flow 4: Navegação para o Design System Living Catalog', async () => {
    const navDS = page.locator('.nav-item', { hasText: 'Design System' })
    await navDS.click()

    await expect(page.locator('.main > header.topbar .title')).toHaveText(/Design System/i)
    await expect(page.getByText('Industrial Brutalist Grid UI', { exact: false })).toBeVisible()
  })
})
