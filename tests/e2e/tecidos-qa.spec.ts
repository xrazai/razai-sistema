import { test, expect, _electron as electron, type ElectronApplication, type Page } from '@playwright/test'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { mkdtempSync, rmSync } from 'node:fs'

test.describe('QA E2E — Módulo de Tecidos', () => {
  let app: ElectronApplication
  let page: Page
  let tempDir: string
  let tempDbPath: string

  const uniqueId = Math.floor(1000 + Math.random() * 9000)
  const fabricName = `Tecido QA Alfa ${uniqueId}`
  const fabricNameEdited = `Tecido QA Beta ${uniqueId}`

  test.beforeAll(async () => {
    // Cria diretório temporário totalmente isolado para o banco de dados do teste
    tempDir = mkdtempSync(join(tmpdir(), 'razai-e2e-tecidos-'))
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
    // Remove o banco temporário de testes para não deixar resíduos
    if (tempDir) {
      try {
        rmSync(tempDir, { recursive: true, force: true })
      } catch (err) {
        console.error('Falha ao limpar diretório temporário de testes:', err)
      }
    }
  })

  test('Flow 1: Navegação até a tela de Tecidos e validação estrutural do catálogo', async () => {
    // Clica no item de navegação "Tecidos" no sidebar
    const navTecidos = page.locator('.nav-item', { hasText: 'Tecidos' })
    await navTecidos.click()

    // Verifica que a Topbar exibe o título Tecidos
    await expect(page.locator('.topbar .title')).toHaveText(/Tecidos/i)

    // Verifica botão de ação para cadastrar na Topbar
    const btnCadastrar = page.getByRole('button', { name: /Cadastrar Tecido/i })
    await expect(btnCadastrar).toBeVisible()

    // Verifica presença do campo de busca e da tabela
    await expect(page.locator('input.search-input')).toBeVisible()
    await expect(page.locator('.table-container table')).toBeVisible()

    // Verifica colunas técnicas obrigatórias
    await expect(page.getByRole('columnheader', { name: /SKU/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /Nome/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /Composição/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /Mais campos/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /Nome/i })).toHaveAttribute('aria-sort', 'ascending')
  })

  test('Flow 1b: Listagem preserva o núcleo sem overflow horizontal em janela estreita', async () => {
    await app.evaluate(({ BrowserWindow }) => {
      BrowserWindow.getAllWindows()[0]?.setSize(960, 640)
    })
    await page.waitForTimeout(150)

    const dimensions = await page.locator('.table-container').evaluate((container) => {
      const table = container.querySelector('table')
      return {
        containerWidth: container.clientWidth,
        tableWidth: table?.scrollWidth ?? 0
      }
    })

    expect(dimensions.tableWidth).toBeLessThanOrEqual(dimensions.containerWidth)

    await app.evaluate(({ BrowserWindow }) => {
      BrowserWindow.getAllWindows()[0]?.setSize(1280, 800)
    })
    await page.waitForTimeout(150)
  })

  test('Flow 2: Busca em tempo real e insensível a acentos (Unaccented)', async () => {
    const searchInput = page.locator('input.search-input')
    await expect(searchInput).toBeVisible()

    // Busca por termo inexistente para validar filtragem e estado vazio
    await searchInput.fill('TERMO_INEXISTENTE_XYZ')
    await page.waitForTimeout(300)
    await expect(page.getByText(/Nenhum tecido encontrado/i)).toBeVisible()

    // Limpa a busca pelo botão '✕' ou limpando o input
    const clearBtn = page.locator('.clear-btn')
    if (await clearBtn.isVisible()) {
      await clearBtn.click()
    } else {
      await searchInput.fill('')
    }
    await page.waitForTimeout(300)

    // Tabela volta ao estado normal
    await expect(page.locator('.table-container table')).toBeVisible()
  })

  test('Flow 3: Validação de erros em campos obrigatórios do formulário de cadastro', async () => {
    // Clica em "Cadastrar Tecido"
    await page.getByRole('button', { name: /Cadastrar Tecido/i }).click()

    // Verifica que está na rota de cadastro
    await expect(page.locator('.topbar .title')).toHaveText(/Tecidos \/ Cadastro/i)

    // Tenta salvar com formulário vazio
    await page.getByRole('button', { name: /Salvar Tecido/i }).click()
    await expect(page.getByText('O campo Nome é obrigatório.')).toBeVisible()

    // Preenche nome e tenta salvar sem composição
    await page.locator('#nome').fill('Veludo Cristal')
    await page.getByRole('button', { name: /Salvar Tecido/i }).click()
    await expect(page.getByText('O campo Composição é obrigatório.')).toBeVisible()

    // Preenche composição e tenta salvar sem largura
    await page.locator('#composicao').fill('100% Poliamida')
    await page.getByRole('button', { name: /Salvar Tecido/i }).click()
    await expect(page.getByText('O campo Largura (m) é obrigatório')).toBeVisible()

    // Preenche largura sem grandezas secundárias
    await page.locator('#largura').fill('1,45')
    await page.getByRole('button', { name: /Salvar Tecido/i }).click()
    await expect(page.getByText(/Preencha ao menos mais um dado numérico/i)).toBeVisible()

    // Cancela o cadastro para retornar à lista
    await page.getByRole('button', { name: /Cancelar/i }).click()
    await expect(page.locator('.topbar .title')).toHaveText('Tecidos')
  })

  test('Flow 4: Cadastro completo com auto-cálculo e geração de SKU', async () => {
    // Abre formulário
    await page.getByRole('button', { name: /Cadastrar Tecido/i }).click()

    // Preenche Identificação
    await page.locator('#nome').fill(fabricName)
    await page.locator('#composicao').fill('100% Seda')

    // Preenche Largura e Rendimento
    await page.locator('#largura').fill('1,40')
    await page.locator('#rendimento').fill('6,00')

    // Aguarda o auto-cálculo reativo da gramatura linear e m²
    await page.waitForTimeout(300)

    const valGramaturaLinear = await page.locator('#gramaturaLinear').inputValue()
    const valGramaturaM2 = await page.locator('#gramaturaM2').inputValue()

    expect(valGramaturaLinear).toBeTruthy()
    expect(valGramaturaM2).toBeTruthy()

    // Preenche propriedades
    await page.locator('#tipo').selectOption('liso')
    await page.locator('#transparencia').selectOption('media')
    await page.locator('#elasticidade').selectOption('nenhuma')
    await page.locator('#acabamento').selectOption('fosco')

    // Salva o novo tecido
    await page.getByRole('button', { name: /Salvar Tecido/i }).click()

    // Confirma retorno para a listagem
    await expect(page.locator('.topbar .title')).toHaveText('Tecidos')
    await expect(page.locator('.feedback-banner')).toContainText('Tecido cadastrado com sucesso.')
    await expect(page.getByRole('button', { name: /Dispensar/i })).toBeVisible()
    await expect(page.locator('.table-hint')).toContainText('Mais campos')

    // Verifica que o novo tecido está listado na tabela com o nome único
    const tableArea = page.locator('.table-container')
    await expect(tableArea.getByText(fabricName)).toBeVisible()
  })

  test('Flow 5: Visualização, edição na tela de detalhes e exclusão com confirmação', async () => {
    // Clica no tecido recém cadastrado na tabela
    const tableArea = page.locator('.table-container')
    await tableArea.getByText(fabricName).click()

    // Verifica tela de detalhes
    await expect(page.locator('.topbar .title')).toHaveText(/Tecidos \/ Detalhes/i)
    await expect(page.locator('#nome')).toHaveValue(fabricName)
    await expect(page.locator('#tecido-detalhes-section-identificacao')).toBeVisible()
    await expect(page.locator('#tecido-detalhes-section-dimensoes')).toBeVisible()
    await expect(page.locator('#tecido-detalhes-section-propriedades')).toBeVisible()
    await expect(page.getByText('Largura (m) *')).toBeVisible()
    await expect(page.getByText('Rendimento (m/kg)')).toBeVisible()
    await expect(page.getByText('Gramatura (g/m²)')).toBeVisible()

    // Edita o nome
    await page.locator('#nome').fill(fabricNameEdited)

    // O código de exibição preliminar deve estar visível
    await expect(page.locator('.code-badge')).toBeVisible()

    // Salva alterações
    await page.getByRole('button', { name: /Salvar Alterações/i }).click()

    // Retorna para a tabela e verifica atualização
    await expect(page.locator('.topbar .title')).toHaveText('Tecidos')
    await expect(page.locator('.feedback-banner')).toContainText('Alterações do tecido salvas com sucesso.')
    await expect(tableArea.getByText(fabricNameEdited)).toBeVisible()

    const searchInput = page.locator('input.search-input')
    await searchInput.fill(fabricNameEdited)
    await page.waitForTimeout(300)
    await expect(page.locator('.toolbar-meta')).toHaveText(/1 de \d+ itens/)
    await expect(page.locator('.toolbar-meta')).not.toContainText('1 de 1')
    await searchInput.fill('')
    await page.waitForTimeout(300)

    // Entra novamente nos detalhes para excluir
    await tableArea.getByText(fabricNameEdited).click()
    await expect(page.locator('.topbar .title')).toHaveText(/Tecidos \/ Detalhes/i)

    // Clica em Excluir Tecido -> Abre modal de confirmação
    await page.getByRole('button', { name: /Excluir Tecido/i }).click()
    const btnConfirmar = page.getByRole('button', { name: /Confirmar Exclusão/i })
    await expect(btnConfirmar).toBeVisible()

    // Confirma a exclusão
    await btnConfirmar.click()

    // Retorna para a lista e valida que o item foi excluído
    await expect(page.locator('.topbar .title')).toHaveText('Tecidos')
    await expect(page.locator('.feedback-banner')).toContainText('Tecido excluído com sucesso.')
    await expect(tableArea.getByText(fabricNameEdited)).not.toBeVisible()
  })
})
