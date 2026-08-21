import { test, expect, _electron as electron, type ElectronApplication, type Page } from '@playwright/test'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { mkdtempSync, rmSync, writeFileSync, existsSync, readFileSync, readdirSync } from 'node:fs'

test.describe('QA E2E — Navegação Geral, Vendas, Pedidos e Settings', () => {
  let app: ElectronApplication
  let page: Page
  let tempDir: string
  let tempDbPath: string
  let tempZplPath: string

  test.beforeAll(async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'razai-e2e-nav-'))
    tempDbPath = join(tempDir, 'razai-test.sqlite')
    tempZplPath = join(tempDir, 'fixture-etiquetas.zpl')
    writeFileSync(tempZplPath,
      '^XA^FDDESTINATARIO^FS^FDPedido: TESTORDER123^FS^XZ' +
      '^XA^FDChecklist de carregamento^FS^FDID Pedido: TESTORDER123^FS' +
      '^FDProduto: Tecido Malha Helanca 1,80m 100% Poliester^FS' +
      '^FDVariacao: Branco Classico, 4m x 1,80m^FS^FDQnt: 1^FS^FDSKU: HELA-BRAN-01^FS^XZ',
      'latin1'
    )

    app = await electron.launch({
      args: ['.'],
      env: {
        ...process.env,
        NODE_ENV: 'test',
        RAZAI_DB_PATH: tempDbPath,
        RAZAI_USER_DATA_PATH: join(tempDir, 'user-data')
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
    await expect(page.getByText(/Inicie um novo lançamento com 3 colunas/i)).toBeVisible()
  })

  test('Flow 2: Navegação para o módulo Pedidos e validação do estado vazio', async () => {
    const navPedidos = page.locator('.nav-item', { hasText: 'Pedidos' })
    await navPedidos.click()

    await expect(page.locator('.main > header.topbar .title')).toHaveText(/Pedidos/i)
    await expect(page.getByText(/Nenhum pedido registrado/i)).toBeVisible()
    await expect(page.getByText(/Cadastre pedidos de clientes em 3 colunas/i)).toBeVisible()
  })

  test('Flow 3: Navegação para Settings e validação das opções de módulo padrão', async () => {
    const navSettings = page.locator('.nav-item', { hasText: 'Settings' })
    await navSettings.click()

    await expect(page.locator('.main > header.topbar .title')).toHaveText(/Settings/i)
    await expect(page.getByText(/Aparência e Preferências de UI/i)).toBeVisible()

    // O select de módulo padrão deve listar Vendas e Pedidos
    const selectRoute = page.locator('#default-route-select')
    await expect(selectRoute).toBeVisible()
    await page.getByRole('tab', { name: /Impressora ESC\/POS/i }).click()
    await expect(page.getByText(/Impressora Térmica/i)).toBeVisible()
  })

  test('Flow 4: Navegação para o Design System Living Catalog', async () => {
    const navDS = page.locator('.nav-item', { hasText: 'Design System' })
    await navDS.click()

    await expect(page.locator('.main > header.topbar .title')).toHaveText(/Design System/i)
    await expect(page.getByText('Industrial Brutalist Grid UI', { exact: false })).toBeVisible()
  })

  test('Flow 5: Navegação para Shopee e abertura do submódulo Etiquetas', async () => {
    const navShopee = page.locator('.nav-item', { hasText: 'Shopee' })
    await navShopee.click()

    await expect(page.locator('.main > header.topbar .title')).toHaveText(/^Shopee$/i)
    await expect(page.locator('.subnav-item', { hasText: 'Etiquetas' })).toBeVisible()
    await expect(page.getByText('SHOPEE / OPERAÇÃO DE MARKETPLACE', { exact: true })).toBeVisible()

    await page.locator('.subnav-item', { hasText: 'Etiquetas' }).click()

    await expect(page.locator('.main > header.topbar .title')).toHaveText(/Shopee \/ Etiquetas/i)
    await expect(page.getByText('Arraste vários ZIPs ou ZPLs', { exact: true })).toBeVisible()
    await page.locator('input[type="file"]').setInputFiles(tempZplPath)
    await expect(page.getByText(/arquivo\(s\) adicionados ao lote/i)).toBeVisible()
    await expect(page.getByText(/^impressao_pendente$/i).first()).toBeVisible({ timeout: 15000 })

    const batchId = await page.evaluate(async () => (await window.razai.shopee.etiquetas.listBatches())[0].id)
    await app.evaluate(async (_electron, fixture) => {
      const createRequire = process.getBuiltinModule('node:module').createRequire
      const Database = createRequire(`${process.cwd()}/package.json`)('better-sqlite3') as typeof import('better-sqlite3')
      const db = new Database(fixture.dbPath)
      db.prepare(`UPDATE shopee_etiqueta_lotes SET status = 'impressao_incerta' WHERE id = ?`).run(fixture.batchId)
      db.close()
    }, { dbPath: tempDbPath, batchId })
    const generated = await page.evaluate((id) => window.razai.shopee.etiquetas.confirmPrinted(id), batchId)
    expect(generated.ok).toBe(true)
    await expect(page.getByText(/^concluido$/i).first()).toBeVisible({ timeout: 15000 })

    const resultDir = join(tempDir, 'user-data', 'shopee', 'etiquetas', batchId, 'resultado')
    const pdfPath = join(resultDir, readdirSync(resultDir).find((name) => name.endsWith('.pdf'))!)
    expect(existsSync(pdfPath)).toBe(true)
    expect(readFileSync(pdfPath).subarray(0, 5).toString('ascii')).toBe('%PDF-')
  })
})
