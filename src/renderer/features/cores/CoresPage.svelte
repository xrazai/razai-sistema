<script lang="ts">
  import Icon from '../../design-system/primitives/Icon.svelte'
  import Table, { type Column } from '../../design-system/data-display/Table.svelte'
  import TableToolbar from '../../design-system/data-display/TableToolbar.svelte'
  import Badge from '../../design-system/data-display/Badge.svelte'
  import EmptyState from '../../design-system/compositions/EmptyState.svelte'
  import CoresCadastroPage from './CoresCadastroPage.svelte'
  import CoresDetalhesPage from './CoresDetalhesPage.svelte'
  import { router } from '../../shell/router.svelte'
  import { generateCorSku } from '../../../shared/sku'
  import type { CorRecord, CreateCorInput, UpdateCorInput } from '../../../shared/types'

  const columns: Column[] = [
    { key: 'swatch', label: 'Amostra', width: '70px', align: 'center' },
    { key: 'codigo', label: 'SKU', width: '130px' },
    { key: 'nome', label: 'Nome da Cor' },
    { key: 'hex', label: 'HEX', width: '130px' },
    { key: 'lab', label: 'LAB (L / A / B)', width: '220px' },
    { key: 'updatedAt', label: 'Atualizado em', width: '140px' }
  ]

  let viewMode = $derived.by<'list' | 'create' | 'details'>(() => {
    if (router.route !== 'cores') return 'list'
    if (router.subRoute === 'cadastro') return 'create'
    if (router.subRoute && router.subRoute !== '') return 'details'
    return 'list'
  })

  let searchTerm = $state('')
  let debouncedSearch = $state('')
  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let selectedCor = $state<CorRecord | null>(null)
  let cores = $state<CorRecord[]>([])
  let isLoading = $state(true)
  let errorMsg = $state<string | null>(null)
  let copiedId = $state<string | null>(null)
  let copyTimeout: ReturnType<typeof setTimeout> | null = null

  async function handleCopyHex(e: MouseEvent, id: string, hexValue: string) {
    e.stopPropagation()
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(hexValue)
      }
      copiedId = id
      if (copyTimeout) clearTimeout(copyTimeout)
      copyTimeout = setTimeout(() => {
        copiedId = null
      }, 1500)
    } catch (err) {
      console.error('Erro ao copiar HEX:', err)
    }
  }

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
    if (isFiltered) return `Nenhuma cor encontrada para "${debouncedSearch}".`
    return 'Nenhuma cor cadastrada no banco de dados.'
  })

  $effect(() => {
    if (router.route === 'cores' && router.subRoute && router.subRoute !== 'cadastro') {
      const id = router.subRoute
      const found = cores.find((c) => c.id === id)
      if (found) {
        selectedCor = found
      } else if (typeof window !== 'undefined' && window.razai?.cores) {
        window.razai.cores.getById(id).then((c) => {
          if (c) selectedCor = c
        })
      }
    }
  })

  async function loadCores(query = '') {
    isLoading = true
    errorMsg = null
    try {
      if (typeof window !== 'undefined' && window.razai?.cores) {
        const data = await window.razai.cores.list(query)
        cores = data
      }
    } catch (err: any) {
      console.error('Erro ao carregar cores:', err)
      errorMsg = err?.message || 'Erro ao carregar cores do banco de dados.'
    } finally {
      isLoading = false
    }
  }

  $effect(() => {
    loadCores(debouncedSearch)
  })

  async function handleNovaCor(nova: CreateCorInput) {
    try {
      if (typeof window !== 'undefined' && window.razai?.cores) {
        const created = await window.razai.cores.create(nova)
        selectedCor = created
        await loadCores(debouncedSearch)
      } else {
        const localItem: CorRecord = {
          id: String(Date.now()),
          codigo: generateCorSku(nova.nome),
          nome: nova.nome,
          hex: nova.hex,
          lab: nova.lab,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        cores = [localItem, ...cores]
        selectedCor = localItem
      }
      router.navigate('cores')
    } catch (err: any) {
      console.error('Erro ao cadastrar cor:', err)
      errorMsg = err?.message || 'Erro ao cadastrar cor no banco de dados.'
      throw err
    }
  }

  async function handleSalvarEdicao(id: string, input: UpdateCorInput) {
    try {
      if (typeof window !== 'undefined' && window.razai?.cores) {
        const updated = await window.razai.cores.update(id, input)
        selectedCor = updated
        await loadCores(debouncedSearch)
      } else {
        cores = cores.map((item) => {
          if (item.id === id) {
            return {
              ...item,
              ...input,
              updatedAt: new Date().toISOString()
            }
          }
          return item
        })
      }
      router.navigate('cores')
    } catch (err: any) {
      console.error('Erro ao atualizar cor:', err)
      errorMsg = err?.message || 'Erro ao atualizar cor.'
      throw err
    }
  }

  async function handleExcluirCor(id: string) {
    try {
      if (typeof window !== 'undefined' && window.razai?.cores) {
        await window.razai.cores.delete(id)
      } else {
        cores = cores.filter((item) => item.id !== id)
      }
      selectedCor = null
      await loadCores(debouncedSearch)
      router.navigate('cores')
    } catch (err: any) {
      console.error('Erro ao excluir cor:', err)
      errorMsg = err?.message || 'Erro ao excluir cor.'
      throw err
    }
  }

  function handleRowClick(row: any) {
    selectedCor = row as CorRecord
    router.navigate(`cores/${selectedCor.id}`)
  }

  function formatDate(iso: string): string {
    if (!iso) return '—'
    try {
      const d = new Date(iso)
      return d.toLocaleDateString('pt-BR')
    } catch {
      return iso
    }
  }
</script>

{#if viewMode === 'create'}
  <CoresCadastroPage
    oncancel={() => router.navigate('cores')}
    onsave={handleNovaCor}
  />
{:else if viewMode === 'details' && selectedCor}
  <CoresDetalhesPage
    cor={selectedCor}
    onback={() => router.navigate('cores')}
    onsave={handleSalvarEdicao}
    ondelete={handleExcluirCor}
  />
{:else}
  <div class="page">
    <div class="layout">
      <!-- Barra superior de ferramentas e contadores -->
      <TableToolbar
        bind:search={searchTerm}
        placeholder="Buscar por SKU, nome, HEX ou LAB..."
        totalCount={cores.length}
        filteredCount={isFiltered ? cores.length : undefined}
        {isLoading}
        {errorMsg}
      />

        <!-- Tabela padrão de itens -->
        <div class="table-container">
          {#if errorMsg && cores.length === 0}
            <div class="error-container">
              <EmptyState
                title="Falha na Comunicação com o Banco de Dados"
                description={errorMsg}
                tone="danger"
                actionLabel="Tentar Novamente"
                actionIcon="search"
                onaction={() => loadCores(searchTerm)}
              />
            </div>
          {:else}
            <Table
              {columns}
              rows={cores}
              bordered={false}
              emptyMessage={emptyMessage}
              onrowclick={handleRowClick}
            >
              {#snippet cell({ row, column, value })}
                {#if column.key === 'swatch'}
                  <div class="swatch-cell">
                    <div class="table-swatch" style:background-color={row.hex}></div>
                  </div>
                {:else if column.key === 'codigo'}
                  <span class="sku-code">{value}</span>
                {:else if column.key === 'hex'}
                  <div class="hex-cell">
                    <span class="code">{value}</span>
                    <button
                      type="button"
                      class="copy-btn"
                      class:copied={copiedId === row.id}
                      onclick={(e) => handleCopyHex(e, row.id, value)}
                      title={copiedId === row.id ? 'Código copiado!' : `Copiar ${value}`}
                      aria-label={`Copiar código ${value}`}
                    >
                      <Icon name={copiedId === row.id ? 'check' : 'copy'} size="sm" />
                    </button>
                  </div>
                {:else if column.key === 'lab'}
                  <span class="lab-value">{value}</span>
                {:else if column.key === 'nome'}
                  <span class="color-name">{value}</span>
                {:else if column.key === 'updatedAt'}
                  <span class="muted-tag">{formatDate(value)}</span>
                {:else}
                  <span>{value || '—'}</span>
                {/if}
              {/snippet}
            </Table>
          {/if}
        </div>

        <!-- Rodapé informativo -->
      <footer class="footer">
        <span class="footer-note">Clique em uma linha para abrir a tela de detalhes e editar o cadastro</span>
        {#if selectedCor}
          <span class="footer-selected">
            Última selecionada: <strong>{selectedCor.codigo} — {selectedCor.nome}</strong>
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

  .error-container {
    padding: var(--space-6) var(--space-4);
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    box-sizing: border-box;
  }

  .swatch-cell {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .table-swatch {
    width: 20px;
    height: 20px;
    border: var(--border-width) solid var(--color-border-strong);
    box-sizing: border-box;
  }

  .hex-cell {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    height: 100%;
    line-height: 100%;
  }

  .copy-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    background: var(--color-bg-elevated);
    border: var(--border-width) solid var(--color-border);
    color: var(--color-fg-muted);
    line-height: 100%;
    cursor: pointer;
    box-sizing: border-box;
    transition: background var(--motion-fast), border-color var(--motion-fast), color var(--motion-fast);
  }

  .copy-btn:hover {
    color: var(--color-fg);
    border-color: var(--color-accent);
    background: var(--color-bg);
  }

  .copy-btn.copied {
    color: var(--color-ok);
    border-color: var(--color-ok);
    background: var(--color-bg-sunken);
  }

  .sku-code {
    font-weight: 700;
    color: var(--color-accent);
    letter-spacing: var(--tracking-header);
    font-family: var(--font-mono);
  }

  .code {
    font-weight: 700;
    color: var(--color-accent);
    letter-spacing: var(--tracking-header);
    font-family: var(--font-mono);
  }

  .color-name {
    color: var(--color-fg);
  }

  .lab-value {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--color-fg-muted);
  }

  .muted-tag {
    color: var(--color-fg-dim);
    font-size: var(--text-xs);
    font-family: var(--font-mono);
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
