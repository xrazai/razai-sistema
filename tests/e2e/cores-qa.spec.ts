import { test, expect, _electron as electron, type ElectronApplication, type Page } from '@playwright/test'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { mkdtempSync, rmSync } from 'node:fs'

test.describe('QA E2E — Módulo de Cores', () => {
  let app: ElectronApplication
  let page: Page
  let tempDir: string
  let tempDbPath: string

  const corNome = 'Azul Olimpo'
  const corNomeEdited = 'Azul Noturno'

  test.beforeAll(async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'razai-e2e-cores-'))
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

  test('Flow 1: Navegação e listagem de cores com paleta e swatches', async () => {
    const navCores = page.locator('.nav-item', { hasText: 'Cores' })
    await navCores.click()

    await expect(page.locator('.topbar .title')).toHaveText(/Cores/i)
    await expect(page.getByRole('button', { name: /Cadastrar Cor/i })).toBeVisible()

    // Campo de busca e tabela presentes
    await expect(page.locator('input.search-input')).toBeVisible()
    await expect(page.locator('.table-container table')).toBeVisible()

    // Colunas obrigatórias
    await expect(page.getByRole('columnheader', { name: /Amostra/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /SKU/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /Nome da Cor/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /HEX/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /LAB/i })).toBeVisible()
  })

  test('Flow 2: Busca de cor por termo e limpeza de filtro', async () => {
    const searchInput = page.locator('input.search-input')
    await searchInput.fill('TERMO_INEXISTENTE_COR')
    await page.waitForTimeout(300)
    await expect(page.getByText(/Nenhuma cor encontrada/i)).toBeVisible()

    const clearBtn = page.locator('.clear-btn')
    if (await clearBtn.isVisible()) {
      await clearBtn.click()
    } else {
      await searchInput.fill('')
    }
    await page.waitForTimeout(300)
    await expect(page.locator('.table-container table')).toBeVisible()
  })

  test('Flow 3: Cadastro de nova cor com swatch e SKU semântico', async () => {
    await page.getByRole('button', { name: /Cadastrar Cor/i }).click()
    await expect(page.locator('.topbar .title')).toHaveText(/Cores \/ Cadastro/i)

    // Preenche campos
    await page.locator('#nome').fill(corNome)
    await page.locator('#hex').fill('#00A896')
    await page.locator('#lab').fill('63,18 / -37,56 / -4,12')

    // Salva a nova cor
    await page.getByRole('button', { name: /Salvar Cor/i }).click()

    // Retorna para a tabela e verifica presença da cor
    await expect(page.locator('.topbar .title')).toHaveText('Cores')
    const tableArea = page.locator('.table-container')
    await expect(tableArea.getByText(corNome)).toBeVisible()
  })

  test('Flow 4: Edição de cor e exclusão com confirmação', async () => {
    const tableArea = page.locator('.table-container')
    await tableArea.getByText(corNome).click()

    await expect(page.locator('.topbar .title')).toHaveText(/Cores \/ Detalhes/i)
    await expect(page.locator('#nome')).toHaveValue(corNome)

    // Altera o nome (mantendo exatamente 2 palavras)
    await page.locator('#nome').fill(corNomeEdited)
    await page.getByRole('button', { name: /Salvar Alterações/i }).click()

    await expect(page.locator('.topbar .title')).toHaveText('Cores')
    await expect(tableArea.getByText(corNomeEdited)).toBeVisible()

    // Entra novamente e exclui
    await tableArea.getByText(corNomeEdited).click()
    await page.getByRole('button', { name: /Excluir Cor/i }).click()

    const btnConfirmar = page.getByRole('button', { name: /Confirmar Exclusão/i })
    await expect(btnConfirmar).toBeVisible()
    await btnConfirmar.click()

    await expect(page.locator('.topbar .title')).toHaveText('Cores')
    await expect(tableArea.getByText(corNomeEdited)).not.toBeVisible()
  })
})
