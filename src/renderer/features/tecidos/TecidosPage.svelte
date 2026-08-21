<script lang="ts">
  import Table, { type Column } from '../../design-system/data-display/Table.svelte'
  import TableToolbar from '../../design-system/data-display/TableToolbar.svelte'
  import EmptyState from '../../design-system/compositions/EmptyState.svelte'
  import Button from '../../design-system/controls/Button.svelte'
  import TecidosCadastroPage from './TecidosCadastroPage.svelte'
  import TecidosDetalhesPage from './TecidosDetalhesPage.svelte'
  import { generateTecidoSku } from './utils'
  import { router } from '../../shell/router.svelte'
  import type { TecidoRecord, CreateTecidoInput, UpdateTecidoInput } from '../../../shared/types'

  const columns: Column[] = [
    { key: 'codigo', label: 'SKU', width: '96px' },
    { key: 'nome', label: 'Nome' },
    { key: 'composicao', label: 'Composição' },
    { key: 'detalhes', label: 'Mais campos', width: '132px', align: 'right', sortable: false }
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
  let totalTecidos = $state(0)
  let isLoading = $state(true)
  let errorMsg = $state<string | null>(null)
  let successMsg = $state('')

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
        const hasQuery = query.trim().length > 0
        const [data, allData] = await Promise.all([
          window.razai.tecidos.list(query),
          hasQuery ? window.razai.tecidos.list() : Promise.resolve(null)
        ])
        tecidos = data
        totalTecidos = allData ? allData.length : data.length
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
    successMsg = ''
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
        totalTecidos = tecidos.length
        selectedTecido = localItem
      }
      successMsg = 'Tecido cadastrado com sucesso.'
      router.navigate('tecidos')
    } catch (err: any) {
      console.error('Erro ao cadastrar tecido:', err)
      throw err
    }
  }

  async function handleSalvarEdicao(id: string, input: UpdateTecidoInput) {
    successMsg = ''
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
        totalTecidos = tecidos.length
      }
      successMsg = 'Alterações do tecido salvas com sucesso.'
      router.navigate('tecidos')
    } catch (err: any) {
      console.error('Erro ao atualizar tecido:', err)
      throw err
    }
  }

  async function handleExcluirTecido(id: string) {
    successMsg = ''
    try {
      if (typeof window !== 'undefined' && window.razai?.tecidos) {
        await window.razai.tecidos.delete(id)
      } else {
        tecidos = tecidos.filter((item) => item.id !== id)
        totalTecidos = tecidos.length
      }
      selectedTecido = null
      await loadTecidos(debouncedSearch)
      successMsg = 'Tecido excluído com sucesso.'
      router.navigate('tecidos')
    } catch (err: any) {
      console.error('Erro ao excluir tecido:', err)
      throw err
    }
  }

  function handleRowClick(row: any) {
    selectedTecido = row as TecidoRecord
    router.navigate(`tecidos/${selectedTecido.id}`)
  }

  function handleDetailsClick(event: MouseEvent, row: TecidoRecord) {
    event.stopPropagation()
    handleRowClick(row)
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
      <TableToolbar
        bind:search={searchTerm}
        placeholder="Buscar por SKU, nome, composição, tipo..."
        totalCount={totalTecidos}
        filteredCount={isFiltered ? tecidos.length : undefined}
        {isLoading}
        {errorMsg}
      />

      {#if successMsg}
        <div class="feedback-banner" role="status" aria-live="polite" aria-atomic="true">
          <span class="feedback-indicator" aria-hidden="true"></span>
          <span class="feedback-text">{successMsg}</span>
          <Button variant="ghost" size="sm" onclick={() => (successMsg = '')}>
            Dispensar
          </Button>
        </div>
      {/if}

      {#if tecidos.length > 0 && !errorMsg}
        <div class="table-hint" role="note">
          <span class="hint-indicator" aria-hidden="true"></span>
          <span>Selecione uma linha ou use Mais campos para consultar métricas técnicas e editar.</span>
        </div>
      {/if}

      <!-- Tabela de identificação; métricas técnicas ficam em Detalhes -->
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
              {#if column.key === 'detalhes'}
                <Button variant="ghost" size="sm" onclick={(event) => handleDetailsClick(event, row as TecidoRecord)}>
                  Mais campos
                </Button>
              {:else if column.key === 'codigo'}
                <span class="code" title={String(value ?? '')}>{value}</span>
              {:else if column.key === 'nome'}
                <span class="fabric-name" title={String(value ?? '')}>{value}</span>
              {:else if column.key === 'composicao'}
                <span class="composition" title={String(value ?? '')}>{value || '—'}</span>
              {:else}
                <span>{value || '—'}</span>
              {/if}
            {/snippet}
          </Table>
        {/if}
      </div>

      <!-- Barra de rodapé informativa -->
      <footer class="footer">
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

  .table-container {
    flex: 1;
    min-height: 0;
    overflow: auto;
    background: var(--color-bg);
    width: 100%;
  }

  .table-container :global(.table) {
    width: 100%;
    min-width: 100%;
    table-layout: fixed;
  }

  .table-container :global(th),
  .table-container :global(td) {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .table-container :global(th:first-child),
  .table-container :global(td:first-child) {
    position: sticky;
    left: 0;
    box-shadow: inset -1px 0 0 0 var(--color-border-strong), inset 0 -1px 0 0 var(--color-border);
  }

  .table-container :global(th:first-child) {
    z-index: 3;
    background: var(--color-bg-elevated);
  }

  .table-container :global(td:first-child) {
    z-index: 2;
    background: var(--color-bg);
  }

  .table-container :global(tbody tr:hover td:first-child) {
    background: var(--color-bg-elevated);
  }

  .feedback-banner {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    height: 40px;
    min-height: 40px;
    padding: 0 var(--space-4);
    box-shadow: inset 0 -1px 0 0 var(--color-border);
    background: var(--color-bg-elevated);
    color: var(--color-ok);
    box-sizing: border-box;
  }

  .feedback-indicator {
    width: 6px;
    height: 6px;
    flex: 0 0 auto;
    border: var(--border-width) solid var(--color-ok);
    background: var(--color-ok);
  }

  .feedback-text {
    min-width: 0;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: var(--text-xs);
    line-height: 100%;
    letter-spacing: var(--tracking-label);
    text-transform: uppercase;
  }

  .table-hint {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    height: 40px;
    min-height: 40px;
    padding: 0 var(--space-4);
    box-shadow: inset 0 -1px 0 0 var(--color-border);
    background: var(--color-bg);
    color: var(--color-fg-dim);
    font-size: var(--text-xs);
    line-height: 100%;
    letter-spacing: var(--tracking-label);
    text-transform: uppercase;
    box-sizing: border-box;
  }

  .table-hint > span:last-child {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .hint-indicator {
    width: 6px;
    height: 6px;
    flex: 0 0 auto;
    border: var(--border-width) solid var(--color-accent);
    background: var(--color-accent);
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

  .footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    height: 40px;
    min-height: 40px;
    padding: var(--space-2) var(--space-4);
    box-shadow: inset 0 1px 0 0 var(--color-border);
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
