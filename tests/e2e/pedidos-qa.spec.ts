import { test, expect, _electron as electron, type ElectronApplication, type Page } from '@playwright/test'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { mkdtempSync, rmSync, existsSync, readFileSync, unlinkSync } from 'node:fs'

test.describe('QA E2E — Módulo de Pedidos', () => {
  let app: ElectronApplication
  let page: Page
  let tempDir: string
  let tempDbPath: string

  test.beforeAll(async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'razai-e2e-pedidos-'))
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

  test('Flow 1: Navegação para o módulo Pedidos e listagem inicial', async () => {
    const navPedidos = page.locator('.nav-item', { hasText: 'Pedidos' })
    await navPedidos.click()

    await expect(page.locator('.main > header.topbar .title')).toHaveText(/Pedidos/i)
    await expect(page.getByRole('button', { name: /Novo Pedido/i })).toBeVisible()
  })

  test('Flow 2: Lançamento de pedido em 3 colunas e aprovação para venda', async () => {
    // Abre formulário de novo pedido
    await page.getByRole('button', { name: /Novo Pedido/i }).click()
    await expect(page.locator('.main > header.topbar .title')).toHaveText(/Pedidos \/ Novo Lançamento/i)

    // Coluna 1: Seleciona tecido
    const firstTecido = page.locator('.col-tecidos .tile-btn').first()
    await expect(firstTecido).toBeVisible()
    await firstTecido.click()

    // Coluna 2: Seleciona cor vinculada
    const firstCor = page.locator('.col-cores .cor-btn').first()
    await expect(firstCor).toBeVisible()
    await firstCor.click()

    // Coluna 3: Ajusta valores e adiciona item
    await page.locator('#input-preco-pedido').fill('38,00')
    await page.locator('#input-qtd-pedido').fill('25,00')
    await page.getByRole('button', { name: /\+ Registrar Item/i }).click()

    await expect(page.locator('.carrinho-item')).toBeVisible()

    // Preenche cliente
    await page.locator('#cliente-pedido').fill('Confecção Primavera')
    await page.locator('#obs-pedido').fill('Retirar na filial')

    // Salva o pedido
    await page.getByRole('button', { name: /Finalizar Pedido/i }).click()

    // Retorna para a tabela de pedidos
    await expect(page.locator('.main > header.topbar .title')).toHaveText('Pedidos')
    await expect(page.getByText('Confecção Primavera')).toBeVisible()
    await expect(page.getByText('PENDENTE')).toBeVisible()

    // Abre os detalhes do pedido
    await page.getByText('Confecção Primavera').click()
    await expect(page.locator('.main > header.topbar .title')).toHaveText(/Pedidos \/ Detalhes/i)

    // Aprova o pedido para converter em venda
    page.once('dialog', (dialog) => dialog.accept())
    await page.getByRole('button', { name: /Aprovar & Gerar Venda/i }).click()

    await expect(page.getByText(/Pedido aprovado com sucesso/i)).toBeVisible()
    await expect(page.getByText('APROVADO')).toBeVisible()
  })

  test('Flow 3: Geração física de PDF A4 em disco via Electron e validação de cabeçalho binário', async () => {
    // Solicita a geração do PDF do pedido criado via IPC
    const result = await page.evaluate(async () => {
      const list = await window.razai.pedidos.list()
      if (list.length === 0) throw new Error('Nenhum pedido encontrado para teste de PDF')
      return window.razai.pedidos.gerarPdf(list[0].id)
    })

    expect(result.ok).toBe(true)
    expect(result.filePath).toBeTruthy()

    const pdfPath = result.filePath!
    expect(existsSync(pdfPath)).toBe(true)

    // Lê os bytes do arquivo gerado para verificar integridade do PDF
    const buffer = readFileSync(pdfPath)
    expect(buffer.length).toBeGreaterThan(1000)

    // Cabeçalho canônico de arquivo PDF (%PDF-)
    const header = buffer.subarray(0, 5).toString('ascii')
    expect(header).toBe('%PDF-')

    // Limpeza do arquivo temporário de teste
    try {
      unlinkSync(pdfPath)
    } catch {
      // Ignora erro de limpeza
    }
  })
})
