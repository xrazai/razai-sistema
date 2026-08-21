import { test, expect, _electron as electron, type ElectronApplication, type Page } from '@playwright/test'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { mkdtempSync, rmSync } from 'node:fs'

test.describe('QA E2E — Módulo de Vendas', () => {
  let app: ElectronApplication
  let page: Page
  let tempDir: string
  let tempDbPath: string

  test.beforeAll(async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'razai-e2e-vendas-'))
    tempDbPath = join(tempDir, 'razai-test.sqlite')

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
    page.on('console', (msg) => console.log('PAGE CONSOLE:', msg.text()))
    page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message))
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

  test('Flow 1: Navegação para o módulo Vendas e listagem inicial', async () => {
    const navVendas = page.locator('.nav-item', { hasText: 'Vendas' })
    await navVendas.click()

    await expect(page.locator('.main > header.topbar .title')).toHaveText(/Vendas/i)
    await expect(page.getByRole('button', { name: /Registrar Venda/i })).toBeVisible()
  })

  test('Flow 2: Lançamento de venda em 3 colunas e confirmação de impressão', async () => {
    // Clica no botão de registrar venda
    await page.getByRole('button', { name: /Registrar Venda/i }).click()
    await expect(page.locator('.main > header.topbar .title')).toHaveText(/Vendas \/ Novo Lançamento/i)

    // Coluna 1: Seleção do Tecido
    const firstTecido = page.locator('.col-tecidos .tile-btn').first()
    await expect(firstTecido).toBeVisible()
    await firstTecido.click()

    // Coluna 2: Seleção da Cor Vinculada
    const firstCor = page.locator('.col-cores .cor-btn').first()
    await expect(firstCor).toBeVisible()
    await firstCor.click()

    // Coluna 3: Ajuste de valores e adição ao carrinho
    await page.locator('#input-preco').fill('48,50')
    await page.locator('#input-qtd').fill('15,00')
    await page.getByRole('button', { name: /\+ Registrar Item/i }).click()

    // Valida que o item apareceu no carrinho
    await expect(page.locator('.carrinho-item')).toBeVisible()
    await expect(page.locator('.carrinho-item .item-subtotal')).toHaveText(/R\$\s*727,50/)

    // Preenche cliente
    await page.locator('#cliente-nome').fill('Ateliê Estrela Dourada')

    // Finaliza a venda
    await page.getByRole('button', { name: /Finalizar Venda/i }).click()

    // Tela de confirmação e recibo térmico
    await expect(page.locator('.main > header.topbar .title')).toHaveText(/Vendas \/ Comprovante/i)
    await expect(page.getByText('Finalizada com Sucesso!')).toBeVisible()
    await expect(page.locator('.receipt-card')).toBeVisible()
    await expect(page.getByText('Ateliê Estrela Dourada')).toBeVisible()

    // Retorna para a tabela de vendas
    await page.getByRole('button', { name: /Voltar para Vendas/i }).click()
    await expect(page.locator('.main > header.topbar .title')).toHaveText('Vendas')
    await expect(page.getByText('Ateliê Estrela Dourada')).toBeVisible()
  })
})
