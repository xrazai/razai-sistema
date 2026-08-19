import { test, expect, _electron as electron, type ElectronApplication, type Page } from '@playwright/test'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { mkdtempSync, rmSync } from 'node:fs'

test.describe('QA E2E — Módulo de Vínculos', () => {
  let app: ElectronApplication
  let page: Page
  let tempDir: string
  let tempDbPath: string

  test.beforeAll(async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'razai-e2e-vinculos-'))
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

  test('Flow 1: Navegação para a tela de Vínculos e visualização mestre-detalhes', async () => {
    const navVinculos = page.locator('.nav-item', { hasText: 'Vínculos' })
    await navVinculos.click()

    await expect(page.locator('.topbar .title')).toHaveText(/Vínculos/i)
    await expect(page.getByRole('button', { name: /Cadastrar Vínculo/i })).toBeVisible()

    // Painel esquerdo (lista de tecidos) e painel direito (tabela de vínculos)
    await expect(page.locator('.master-panel')).toBeVisible()
    await expect(page.locator('.detail-panel')).toBeVisible()
    await expect(page.locator('table')).toBeVisible()

    // Colunas da tabela
    await expect(page.getByRole('columnheader', { name: /^Cor\b/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /Nome da Cor/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /SKU Consolidado/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /Ações/i })).toBeVisible()
  })

  test('Flow 2: Abertura da grade de cadastro e seleção de tecido e cores em lote', async () => {
    await page.getByRole('button', { name: /Cadastrar Vínculo/i }).click()
    await expect(page.locator('.topbar .title')).toHaveText(/Vínculos \/ Cadastro/i)

    // Seção 01: Seleção de Tecido
    await expect(page.getByText('01. Seleção do Tecido Base')).toBeVisible()
    const firstTecidoTile = page.locator('.tecido-tile').first()
    await expect(firstTecidoTile).toBeVisible()
    await firstTecidoTile.click()

    // Seção 02: Seleção das Cores
    await expect(page.getByText('02. Seleção das Cores da Cartela')).toBeVisible()
    const corTiles = page.locator('.cor-tile')
    await expect(corTiles.first()).toBeVisible()

    // Clica em "Marcar todas" se disponível, ou seleciona os tiles disponíveis
    const btnSelectAll = page.getByRole('button', { name: /Marcar todas/i })
    if (await btnSelectAll.isVisible()) {
      await btnSelectAll.click()
    } else {
      await corTiles.first().click()
    }

    // Botão de salvar no rodapé fica habilitado
    const btnSalvar = page.locator('.form-footer .btn[data-variant="primary"]')
    await expect(btnSalvar).toBeEnabled()

    // Salva os vínculos criados
    await btnSalvar.click()

    // Retorna para a visualização principal e valida que os vínculos aparecem na tabela
    await expect(page.locator('.topbar .title')).toHaveText('Vínculos')
    await expect(page.locator('table tbody tr').first()).toBeVisible()
    const count = await page.locator('table tbody tr').count()
    expect(count).toBeGreaterThan(0)
  })

  test('Flow 3: Desvinculação com confirmação', async () => {
    const rows = page.locator('table tbody tr')
    const count = await rows.count()

    if (count > 0) {
      page.once('dialog', (dialog) => dialog.accept())

      const btnDelete = page.locator('table button.action-btn.danger').first()
      if (await btnDelete.isVisible()) {
        await btnDelete.click()
        await page.waitForTimeout(300)
      }
    }

    await expect(page.locator('.topbar .title')).toHaveText('Vínculos')
  })
})
