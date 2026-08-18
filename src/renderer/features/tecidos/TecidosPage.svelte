<script lang="ts">
  import Icon from '../../design-system/primitives/Icon.svelte'
  import Table, { type Column } from '../../design-system/data-display/Table.svelte'
  import Badge from '../../design-system/data-display/Badge.svelte'
  import EmptyState from '../../design-system/compositions/EmptyState.svelte'
  import TecidosCadastroPage from './TecidosCadastroPage.svelte'
  import TecidosDetalhesPage from './TecidosDetalhesPage.svelte'
  import { generateTecidoSku } from './utils'
  import { router } from '../../shell/router.svelte'
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

  let viewMode = $derived.by<'list' | 'create' | 'details'>(() => {
    if (router.route !== 'tecidos') return 'list'
    if (router.subRoute === 'cadastro') return 'create'
    if (router.subRoute && router.subRoute !== '') return 'details'
    return 'list'
  })

  let searchTerm = $state('')
  let debouncedSearch = $state('')
  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let selectedTecido = $state<TecidoRecord | null>(null)
  let tecidos = $state<TecidoRecord[]>([])
  let isLoading = $state(true)
  let errorMsg = $state<string | null>(null)

  $effect(() => {
    const term = searchTerm
    if (!term) {
      if (debounceTimer) clearTimeout(debounceTimer)
      debouncedSearch = ''
      return
    }
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      debouncedSearch = term
    }, 200)
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer)
    }
  })

  let isFiltered = $derived(debouncedSearch.trim().length > 0)
  let emptyMessage = $derived.by(() => {
    if (isLoading) return 'Carregando dados...'
    if (isFiltered) return `Nenhum tecido encontrado para "${debouncedSearch}".`
    return 'Nenhum tecido cadastrado no banco de dados.'
  })

  $effect(() => {
    if (router.route === 'tecidos' && router.subRoute && router.subRoute !== 'cadastro') {
      const id = router.subRoute
      const found = tecidos.find((t) => t.id === id)
      if (found) {
        selectedTecido = found
      } else if (typeof window !== 'undefined' && window.razai?.tecidos) {
        window.razai.tecidos.getById(id).then((t) => {
          if (t) selectedTecido = t
        })
      }
    }
  })

  async function loadTecidos(query = '') {
    isLoading = true
    errorMsg = null
    try {
      if (typeof window !== 'undefined' && window.razai?.tecidos) {
        const data = await window.razai.tecidos.list(query)
        tecidos = data
      }
    } catch (err: any) {
      console.error('Erro ao carregar tecidos:', err)
      errorMsg = err?.message || 'Erro ao carregar tecidos do banco de dados.'
    } finally {
      isLoading = false
    }
  }

  $effect(() => {
    loadTecidos(debouncedSearch)
  })

  async function handleNovoTecido(novo: CreateTecidoInput) {
    try {
      if (typeof window !== 'undefined' && window.razai?.tecidos) {
        const created = await window.razai.tecidos.create(novo)
        selectedTecido = created
        await loadTecidos(debouncedSearch)
      } else {
        const sku = generateTecidoSku(novo.nome)
        const localItem: TecidoRecord = {
          id: String(Date.now()),
          codigo: sku,
          nome: novo.nome,
          composicao: novo.composicao,
          largura: novo.largura,
          rendimento: novo.rendimento ?? null,
          gramaturaLinear: novo.gramaturaLinear ?? null,
          gramaturaM2: novo.gramaturaM2 ?? null,
          tipo: novo.tipo ?? null,
          transparencia: novo.transparencia ?? null,
          elasticidade: novo.elasticidade ?? null,
          acabamento: novo.acabamento ?? null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        tecidos = [localItem, ...tecidos]
        selectedTecido = localItem
      }
      router.navigate('tecidos')
    } catch (err: any) {
      console.error('Erro ao cadastrar tecido:', err)
      errorMsg = err?.message || 'Erro ao cadastrar tecido no banco de dados.'
      throw err
    }
  }

  async function handleSalvarEdicao(id: string, input: UpdateTecidoInput) {
    try {
      if (typeof window !== 'undefined' && window.razai?.tecidos) {
        const updated = await window.razai.tecidos.update(id, input)
        selectedTecido = updated
        await loadTecidos(debouncedSearch)
      } else {
        tecidos = tecidos.map((item) => {
          if (item.id === id) {
            return {
              ...item,
              ...input,
              codigo: input.nome ? generateTecidoSku(input.nome) : item.codigo,
              updatedAt: new Date().toISOString()
            }
          }
          return item
        })
      }
      router.navigate('tecidos')
    } catch (err: any) {
      console.error('Erro ao atualizar tecido:', err)
      errorMsg = err?.message || 'Erro ao atualizar tecido.'
      throw err
    }
  }

  async function handleExcluirTecido(id: string) {
    try {
      if (typeof window !== 'undefined' && window.razai?.tecidos) {
        await window.razai.tecidos.delete(id)
      } else {
        tecidos = tecidos.filter((item) => item.id !== id)
      }
      selectedTecido = null
      await loadTecidos(debouncedSearch)
      router.navigate('tecidos')
    } catch (err: any) {
      console.error('Erro ao excluir tecido:', err)
      errorMsg = err?.message || 'Erro ao excluir tecido.'
      throw err
    }
  }

  function handleRowClick(row: any) {
    selectedTecido = row as TecidoRecord
    router.navigate(`tecidos/${selectedTecido.id}`)
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
    oncancel={() => router.navigate('tecidos')}
    onsave={handleNovoTecido}
  />
{:else if viewMode === 'details' && selectedTecido}
  <TecidosDetalhesPage
    tecido={selectedTecido}
    onback={() => router.navigate('tecidos')}
    onsave={handleSalvarEdicao}
    ondelete={handleExcluirTecido}
  />
{:else}
  <div class="page">
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
            {:else if isFiltered}
              <Badge
                text={`${tecidos.length} ${tecidos.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}`}
                tone={tecidos.length === 0 ? 'warn' : 'neutral'}
              />
            {:else}
              <Badge text={`${tecidos.length} ${tecidos.length === 1 ? 'tecido cadastrado' : 'tecidos cadastrados'}`} tone="neutral" />
            {/if}
          </div>
        </div>

        <!-- Tabela padrão de itens ou estado de erro -->
        <div class="table-container">
          {#if errorMsg && tecidos.length === 0}
            <div class="error-container">
              <EmptyState
                title="Falha na Comunicação com o Banco de Dados"
                description={errorMsg}
                tone="danger"
                actionLabel="Tentar Novamente"
                actionIcon="search"
                onaction={() => loadTecidos(searchTerm)}
              />
            </div>
          {:else}
            <Table
              {columns}
              rows={tecidos}
              bordered={false}
              emptyMessage={emptyMessage}
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
          {/if}
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
    height: 48px;
    min-height: 48px;
    padding: var(--space-2) var(--space-4);
    background: var(--color-bg-sunken);
    border-bottom: var(--border-width) solid var(--color-border);
    width: 100%;
    box-sizing: border-box;
    line-height: 100%;
  }

  .search-box {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex: 1;
    max-width: 460px;
    height: 32px;
    padding: var(--space-1) var(--space-2);
    border: var(--border-width) solid var(--color-border);
    background: var(--color-bg);
    color: var(--color-fg-muted);
    box-sizing: border-box;
    line-height: 100%;
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

  .error-container {
    padding: var(--space-6) var(--space-4);
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    box-sizing: border-box;
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
    height: 40px;
    min-height: 40px;
    padding: var(--space-2) var(--space-4);
    border-top: var(--border-width) solid var(--color-border);
    background: var(--color-bg-elevated);
    font-size: var(--text-xs);
    line-height: 100%;
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
