<script lang="ts">
  import Panel from '../../design-system/layout/Panel.svelte'
  import Stack from '../../design-system/layout/Stack.svelte'
  import Cell from '../../design-system/primitives/Cell.svelte'
  import Icon from '../../design-system/primitives/Icon.svelte'
  import Button from '../../design-system/controls/Button.svelte'
  import Table, { type Column } from '../../design-system/data-display/Table.svelte'
  import Badge from '../../design-system/data-display/Badge.svelte'
  import TecidosCadastroPage from './TecidosCadastroPage.svelte'
  import TecidosDetalhesPage from './TecidosDetalhesPage.svelte'
  import type { TecidoRecord, CreateTecidoInput, UpdateTecidoInput } from '../../../shared/types'

  const columns: Column[] = [
    { key: 'codigo', label: 'SKU', width: '90px' },
    { key: 'nome', label: 'Nome' },
    { key: 'composicao', label: 'Composição' },
    { key: 'largura', label: 'Largura (m)', width: '120px' },
    { key: 'rendimento', label: 'Rendimento (m/kg)', width: '150px' },
    { key: 'gramaturaLinear', label: 'Gramatura Linear (g/m)', width: '170px' },
    { key: 'gramaturaM2', label: 'Gramatura (g/m²)', width: '150px' },
    { key: 'tipo', label: 'Tipo', width: '110px' },
    { key: 'acabamento', label: 'Acabamento', width: '120px' }
  ]

  let viewMode = $state<'list' | 'create' | 'details'>('list')
  let searchTerm = $state('')
  let selectedTecido = $state<TecidoRecord | null>(null)
  let tecidos = $state<TecidoRecord[]>([])
  let isLoading = $state(true)
  let errorMsg = $state<string | null>(null)

  async function loadTecidos(query = '') {
    isLoading = true
    errorMsg = null
    try {
      if (window.razai?.tecidos) {
        tecidos = await window.razai.tecidos.list(query)
      }
    } catch (err: any) {
      errorMsg = err?.message || 'Erro ao carregar tecidos do banco de dados.'
    } finally {
      isLoading = false
    }
  }

  $effect(() => {
    loadTecidos(searchTerm)
  })

  async function handleNovoTecido(novo: CreateTecidoInput) {
    if (window.razai?.tecidos) {
      const created = await window.razai.tecidos.create(novo)
      selectedTecido = created
    }
    await loadTecidos(searchTerm)
    viewMode = 'list'
  }

  async function handleSalvarEdicao(id: string, input: UpdateTecidoInput) {
    if (window.razai?.tecidos) {
      const updated = await window.razai.tecidos.update(id, input)
      selectedTecido = updated
    }
    await loadTecidos(searchTerm)
    viewMode = 'list'
  }

  async function handleExcluirTecido(id: string) {
    if (window.razai?.tecidos) {
      await window.razai.tecidos.delete(id)
    }
    selectedTecido = null
    await loadTecidos(searchTerm)
    viewMode = 'list'
  }

  function handleRowClick(row: any) {
    selectedTecido = row as TecidoRecord
    viewMode = 'details'
  }

  function formatDisplayLabel(val: string | null | undefined): string {
    if (!val) return '—'
    const map: Record<string, string> = {
      liso: 'Liso',
      estampado: 'Estampado',
      nenhuma: 'Nenhuma',
      baixa: 'Baixa',
      media: 'Média',
      alta: 'Alta',
      fosco: 'Fosco',
      semi_brilho: 'Semi-brilho',
      brilhante: 'Brilhante'
    }
    return map[val] || val
  }
</script>

{#if viewMode === 'create'}
  <TecidosCadastroPage
    oncancel={() => (viewMode = 'list')}
    onsave={handleNovoTecido}
  />
{:else if viewMode === 'details' && selectedTecido}
  <TecidosDetalhesPage
    tecido={selectedTecido}
    onback={() => (viewMode = 'list')}
    onsave={handleSalvarEdicao}
    ondelete={handleExcluirTecido}
  />
{:else}
  <div class="page">
    <Panel title="Tecidos" flush>
      {#snippet actions()}
        <Button variant="primary" size="sm" onclick={() => (viewMode = 'create')}>
          <Icon name="plus" size="sm" />
          <span>Cadastrar Tecido</span>
        </Button>
      {/snippet}

      <div class="layout">
        <!-- Barra superior de ferramentas / busca / contadores -->
        <div class="toolbar">
          <div class="search-box">
            <Icon name="search" size="sm" />
            <input
              type="text"
              class="search-input"
              bind:value={searchTerm}
              placeholder="Buscar por SKU, nome, composição, tipo..."
            />
            {#if searchTerm}
              <button class="clear-btn" onclick={() => (searchTerm = '')} aria-label="Limpar busca">
                ✕
              </button>
            {/if}
          </div>
          <div class="toolbar-meta">
            {#if errorMsg}
              <Badge text={errorMsg} tone="danger" />
            {:else if isLoading}
              <Badge text="Carregando..." tone="neutral" />
            {:else}
              <Badge text={`${tecidos.length} ${tecidos.length === 1 ? 'tecido cadastrado' : 'tecidos cadastrados'}`} tone="neutral" />
            {/if}
          </div>
        </div>

        <!-- Tabela padrão de itens -->
        <div class="table-container">
          <Table
            {columns}
            rows={tecidos}
            bordered={false}
            emptyMessage={isLoading ? 'Carregando dados...' : 'Nenhum tecido encontrado no banco de dados.'}
            onrowclick={handleRowClick}
          >
            {#snippet cell({ row, column, value })}
              {#if column.key === 'codigo'}
                <span class="code">{value}</span>
              {:else if column.key === 'largura'}
                <span>{value !== null && value !== undefined ? `${Number(value).toFixed(2).replace('.', ',')} m` : '—'}</span>
              {:else if column.key === 'rendimento'}
                <span>{value !== null && value !== undefined ? `${Number(value).toFixed(2).replace('.', ',')} m/kg` : '—'}</span>
              {:else if column.key === 'gramaturaLinear'}
                <span>{value !== null && value !== undefined ? `${Math.round(Number(value))} g/m` : '—'}</span>
              {:else if column.key === 'gramaturaM2'}
                <span>{value !== null && value !== undefined ? `${Math.round(Number(value))} g/m²` : '—'}</span>
              {:else if column.key === 'tipo' || column.key === 'acabamento'}
                <span class="muted-tag">{formatDisplayLabel(value)}</span>
              {:else if column.key === 'nome'}
                <span class="fabric-name">{value}</span>
              {:else}
                <span>{value || '—'}</span>
              {/if}
            {/snippet}
          </Table>
        </div>

        <!-- Barra de rodapé informativa -->
        <footer class="footer">
          <span class="footer-note">Clique em uma linha para abrir a tela de detalhes e editar o cadastro</span>
          {#if selectedTecido}
            <span class="footer-selected">
              Último selecionado: <strong>{selectedTecido.codigo} — {selectedTecido.nome}</strong>
            </span>
          {/if}
        </footer>
      </div>
    </Panel>
  </div>
{/if}

<style>
  .page {
    height: 100%;
    min-height: 0;
    display: grid;
    width: 100%;
  }

  .page :global(.panel) {
    height: 100%;
    min-height: 0;
    width: 100%;
  }

  .layout {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    width: 100%;
  }

  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-3);
    background: var(--color-bg-sunken);
    border-bottom: var(--border-width) solid var(--color-border);
    width: 100%;
    box-sizing: border-box;
  }

  .search-box {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex: 1;
    max-width: 460px;
    padding: var(--space-1) var(--space-2);
    border: var(--border-width) solid var(--color-border);
    background: var(--color-bg);
    color: var(--color-fg-muted);
  }

  .search-box:focus-within {
    border-color: var(--color-border-strong);
    color: var(--color-fg);
  }

  .search-input {
    width: 100%;
    border: none;
    background: transparent;
    color: var(--color-fg);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    outline: none;
  }

  .search-input::placeholder {
    color: var(--color-fg-dim);
  }

  .clear-btn {
    border: none;
    background: transparent;
    color: var(--color-fg-dim);
    font-size: var(--text-xs);
    padding: 0 var(--space-1);
    cursor: pointer;
  }

  .clear-btn:hover {
    color: var(--color-fg);
  }

  .toolbar-meta {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .table-container {
    flex: 1;
    min-height: 0;
    overflow: auto;
    background: var(--color-bg);
    width: 100%;
  }

  .code {
    font-weight: 700;
    color: var(--color-accent);
    letter-spacing: var(--tracking-header);
    font-family: var(--font-mono);
  }

  .fabric-name {
    color: var(--color-fg);
  }

  .muted-tag {
    color: var(--color-fg-muted);
    font-size: var(--text-xs);
  }

  .footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-3);
    border-top: var(--border-width) solid var(--color-border);
    background: var(--color-bg-elevated);
    font-size: var(--text-xs);
    color: var(--color-fg-dim);
    letter-spacing: var(--tracking-label);
    text-transform: uppercase;
    width: 100%;
    box-sizing: border-box;
  }

  .footer-selected strong {
    color: var(--color-fg);
  }
</style>
