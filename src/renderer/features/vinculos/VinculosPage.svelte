<script lang="ts">
  import Icon from '../../design-system/primitives/Icon.svelte'
  import Badge from '../../design-system/data-display/Badge.svelte'
  import Button from '../../design-system/controls/Button.svelte'
  import EmptyState from '../../design-system/compositions/EmptyState.svelte'
  import Table, { type Column } from '../../design-system/data-display/Table.svelte'
  import VinculosCadastroPage from './VinculosCadastroPage.svelte'
  import { router } from '../../shell/router.svelte'
  import type { VinculoRecord, TecidoRecord } from '../../../shared/types'
  import { normalizeUnaccent } from '../../../shared/sku'

  let viewMode = $derived.by<'list' | 'create'>(() => {
    if (router.route !== 'vinculos') return 'list'
    if (router.subRoute === 'cadastro') return 'create'
    return 'list'
  })

  let searchTerm = $state('')
  let debouncedSearch = $state('')
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  let vinculos = $state<VinculoRecord[]>([])
  let tecidos = $state<TecidoRecord[]>([])
  let selectedTecidoId = $state<string | null>(null)
  let isLoading = $state(true)
  let errorMsg = $state<string | null>(null)
  let copiedSku = $state<string | null>(null)
  let copyTimer: ReturnType<typeof setTimeout> | null = null

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

  async function loadData(query = '') {
    isLoading = true
    errorMsg = null
    try {
      if (typeof window !== 'undefined' && window.razai) {
        const [vincList, tecList] = await Promise.all([
          window.razai.vinculos.list(query),
          window.razai.tecidos.list()
        ])
        vinculos = vincList
        tecidos = tecList

        // Se não tiver selecionado nenhum tecido ainda, seleciona o primeiro que possui vínculos ou o primeiro do catálogo
        if (!selectedTecidoId && tecList.length > 0) {
          const tecWithVinc = tecList.find((t) => vincList.some((v) => v.tecidoId === t.id))
          selectedTecidoId = tecWithVinc ? tecWithVinc.id : tecList[0].id
        }
      }
    } catch (err: any) {
      console.error('Erro ao carregar vínculos:', err)
      errorMsg = err?.message || 'Falha ao carregar vínculos do banco de dados.'
    } finally {
      isLoading = false
    }
  }

  $effect(() => {
    if (viewMode === 'list') {
      loadData(debouncedSearch)
    }
  })

  let isFiltered = $derived(debouncedSearch.trim().length > 0)

  // Agrupamento de tecidos com contador de vínculos
  let tecidosWithCount = $derived.by(() => {
    const term = normalizeUnaccent(debouncedSearch.trim())
    return tecidos
      .map((t) => {
        const tVinculos = vinculos.filter((v) => v.tecidoId === t.id)
        return {
          tecido: t,
          vinculos: tVinculos,
          count: tVinculos.length
        }
      })
      .filter((item) => {
        if (!term) return true
        const c = normalizeUnaccent(item.tecido.codigo)
        const n = normalizeUnaccent(item.tecido.nome)
        const hasMatchingVinculo = item.vinculos.some((v) => {
          return (
            normalizeUnaccent(v.sku).includes(term) ||
            normalizeUnaccent(v.corNome).includes(term) ||
            normalizeUnaccent(v.corCodigo).includes(term) ||
            normalizeUnaccent(v.corHex).includes(term)
          )
        })
        return c.includes(term) || n.includes(term) || hasMatchingVinculo
      })
  })

  let selectedTecido = $derived(tecidos.find((t) => t.id === selectedTecidoId) || null)

  let selectedTecidoVinculos = $derived(
    vinculos.filter((v) => v.tecidoId === selectedTecidoId)
  )

  const columns: Column[] = [
    { key: 'swatch', label: 'Cor', width: '50px' },
    { key: 'corNome', label: 'Nome da Cor' },
    { key: 'corHex', label: 'HEX', width: '100px' },
    { key: 'corCodigo', label: 'SKU Cor', width: '100px' },
    { key: 'sku', label: 'SKU Consolidado (Produto)', width: '220px' },
    { key: 'actions', label: 'Ações', width: '90px' }
  ]

  async function handleSalvarNovosVinculos(tecidoId: string, corIds: string[]) {
    try {
      if (typeof window !== 'undefined' && window.razai?.vinculos) {
        await window.razai.vinculos.createBatch({ tecidoId, corIds })
      }
      selectedTecidoId = tecidoId
      router.navigate('vinculos')
      await loadData(debouncedSearch)
    } catch (err: any) {
      console.error('Erro ao salvar novos vínculos:', err)
      throw err
    }
  }

  async function handleDesvincular(id: string, sku: string) {
    if (!confirm(`Deseja realmente desvincular o produto "${sku}"?`)) {
      return
    }
    try {
      if (typeof window !== 'undefined' && window.razai?.vinculos) {
        await window.razai.vinculos.delete(id)
      }
      await loadData(debouncedSearch)
    } catch (err: any) {
      console.error('Erro ao desvincular:', err)
      alert(err?.message || 'Erro ao desvincular produto.')
    }
  }

  function handleCopySku(sku: string) {
    navigator.clipboard.writeText(sku)
    copiedSku = sku
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copiedSku = null
    }, 1500)
  }
</script>

{#if viewMode === 'create'}
  <VinculosCadastroPage
    initialTecidoId={selectedTecidoId || undefined}
    oncancel={() => router.navigate('vinculos')}
    onsave={handleSalvarNovosVinculos}
  />
{:else}
  <div class="page">
    <div class="layout">
      <!-- BARRA DE FERRAMENTAS / BUSCA -->
      <div class="toolbar">
        <div class="search-box">
          <Icon name="search" size="sm" />
          <input
            type="text"
            class="search-input"
            bind:value={searchTerm}
            placeholder="Buscar por SKU do produto, tecido, cor ou código..."
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
            <Badge text={`${tecidosWithCount.length} tecidos no catálogo`} tone="neutral" />
            <Badge text={`${vinculos.length} produtos / vínculos consolidados`} tone="info" />
          {/if}
        </div>
      </div>

      <!-- CORPO PRINCIPAL SPLIT (MESTRE-DETALHES) -->
      {#if vinculos.length === 0 && !isLoading && !isFiltered}
        <div class="empty-container">
          <EmptyState
            title="Nenhum vínculo cadastrado"
            description="Associe tecidos e cores da sua coleção para gerar automaticamente os produtos vendáveis e seus SKUs."
            actionLabel="Cadastrar Primeiro Vínculo"
            actionIcon="plus"
            onaction={() => router.navigate('vinculos/cadastro')}
          />
        </div>
      {:else}
        <div class="split-body">
          <!-- PAINEL ESQUERDO: LISTA DE TECIDOS -->
          <div class="master-panel">
            <div class="panel-header">
              <span class="panel-title">TECIDOS / BASES</span>
              <span class="panel-count">{tecidosWithCount.length}</span>
            </div>

            <div class="master-list">
              {#each tecidosWithCount as item (item.tecido.id)}
                <button
                  type="button"
                  class="tecido-row"
                  class:active={selectedTecidoId === item.tecido.id}
                  onclick={() => (selectedTecidoId = item.tecido.id)}
                >
                  <div class="row-main">
                    <div class="row-title-line">
                      <span class="sku-code">{item.tecido.codigo}</span>
                      <span class="tecido-name">{item.tecido.nome}</span>
                    </div>
                    <span class="tecido-comp">{item.tecido.composicao}</span>
                  </div>

                  <div class="row-badge">
                    <Badge
                      text={`${item.count} ${item.count === 1 ? 'cor' : 'cores'}`}
                      tone={item.count > 0 ? 'neutral' : 'warn'}
                    />
                  </div>
                </button>
              {/each}
            </div>
          </div>

          <!-- PAINEL DIREITO: CARTELA E VÍNCULOS DO TECIDO SELECIONADO -->
          <div class="detail-panel">
            {#if selectedTecido}
              <div class="detail-header">
                <div class="detail-info">
                  <div class="detail-sku-badge">{selectedTecido.codigo}</div>
                  <div class="detail-titles">
                    <h3 class="detail-name">{selectedTecido.nome}</h3>
                    <span class="detail-sub">{selectedTecido.composicao} • Largura: {selectedTecido.largura}m</span>
                  </div>
                </div>

                <div class="detail-actions">
                  <Button
                    variant="secondary"
                    size="sm"
                    onclick={() => router.navigate('vinculos/cadastro')}
                  >
                    <Icon name="plus" size="sm" />
                    <span>+ Adicionar Cores</span>
                  </Button>
                </div>
              </div>

              <div class="detail-table-wrap">
                {#if selectedTecidoVinculos.length === 0}
                  <div class="no-vinculos-box">
                    <EmptyState
                      title="Nenhuma cor vinculada a este tecido"
                      description="Clique em '+ Adicionar Cores' para selecionar a cartela deste tecido."
                      actionLabel="+ Adicionar Cores"
                      actionIcon="plus"
                      onaction={() => router.navigate('vinculos/cadastro')}
                    />
                  </div>
                {:else}
                  <Table
                    {columns}
                    rows={selectedTecidoVinculos}
                    bordered={false}
                    emptyMessage="Nenhuma cor encontrada."
                  >
                    {#snippet cell({ row, column, value })}
                      {#if column.key === 'swatch'}
                        <span
                          class="swatch-cell"
                          style="background-color: {row.corHex};"
                          title={row.corNome}
                        ></span>
                      {:else if column.key === 'corNome'}
                        <span class="cor-name-text">{value}</span>
                      {:else if column.key === 'corHex'}
                        <span class="mono-text">{value}</span>
                      {:else if column.key === 'corCodigo'}
                        <span class="mono-text cor-sku">{value}</span>
                      {:else if column.key === 'sku'}
                        <div class="sku-cell">
                          <span class="product-sku">{value}</span>
                          <button
                            type="button"
                            class="copy-btn"
                            title="Copiar SKU do Produto"
                            onclick={() => handleCopySku(value)}
                          >
                            <Icon name="copy" size="sm" />
                            {#if copiedSku === value}
                              <span class="copied-tooltip">Copiado!</span>
                            {/if}
                          </button>
                        </div>
                      {:else if column.key === 'actions'}
                        <button
                          type="button"
                          class="unlink-btn"
                          title="Desvincular produto"
                          onclick={() => handleDesvincular(row.id, row.sku)}
                        >
                          ✕ Desvincular
                        </button>
                      {/if}
                    {/snippet}
                  </Table>
                {/if}
              </div>
            {:else}
              <div class="empty-hint-pane">
                <span>Selecione um tecido à esquerda para visualizar sua cartela de vínculos.</span>
              </div>
            {/if}
          </div>
        </div>
      {/if}

      <!-- RODAPÉ MODULAR (40PX) -->
      <footer class="footer">
        <span class="footer-note">
          O código final do produto é formado pela união do SKU do Tecido (4 letras) + SKU da Cor (8 letras).
        </span>
        {#if selectedTecido}
          <span class="footer-selected">
            Tecido ativo: <strong>{selectedTecido.codigo} — {selectedTecido.nome}</strong> ({selectedTecidoVinculos.length} cores)
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
    line-height: 100%;
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
    gap: var(--space-4);
    height: 40px;
    min-height: 40px;
    padding: 0 var(--space-4) 0 0;
    background: var(--color-bg-sunken);
    box-shadow: inset 0 -1px 0 0 var(--color-border);
    width: 100%;
    box-sizing: border-box;
    line-height: 100%;
  }

  .search-box {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex: 1;
    max-width: 480px;
    height: 100%;
    padding: var(--space-2) var(--space-3);
    border: none;
    box-shadow: inset -1px 0 0 0 var(--color-border);
    background: var(--color-bg);
    color: var(--color-fg-muted);
    box-sizing: border-box;
    line-height: 100%;
  }

  .search-box:focus-within {
    box-shadow: inset -1px 0 0 0 var(--color-border-strong);
    background: var(--color-bg-elevated);
    color: var(--color-fg);
  }

  .search-input {
    width: 100%;
    height: 100%;
    border: none;
    background: transparent;
    color: var(--color-fg);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    line-height: 100%;
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
    line-height: 100%;
    padding: var(--space-1);
    cursor: pointer;
  }

  .clear-btn:hover {
    color: var(--color-fg);
  }

  .toolbar-meta {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    line-height: 100%;
  }

  .empty-container {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-6);
  }

  .split-body {
    display: grid;
    grid-template-columns: 360px 1fr;
    flex: 1;
    min-height: 0;
    width: 100%;
    background: var(--color-bg);
  }

  .master-panel {
    display: flex;
    flex-direction: column;
    min-height: 0;
    height: 100%;
    box-shadow: inset -1px 0 0 0 var(--color-border);
    background: var(--color-bg-sunken);
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 36px;
    min-height: 36px;
    padding: 0 var(--space-3);
    background: var(--color-bg-elevated);
    box-shadow: inset 0 -1px 0 0 var(--color-border);
    line-height: 100%;
  }

  .panel-title {
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    color: var(--color-fg);
    letter-spacing: var(--tracking-header);
    line-height: 100%;
  }

  .panel-count {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--color-fg-dim);
    line-height: 100%;
  }

  .master-list {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }

  .tecido-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    min-height: 48px;
    background: var(--color-bg);
    box-shadow: inset 0 -1px 0 0 var(--color-border);
    border: none;
    text-align: left;
    cursor: pointer;
    line-height: 100%;
    transition: background var(--motion-fast);
  }

  .tecido-row:hover {
    background: var(--color-bg-elevated);
  }

  .tecido-row.active {
    background: var(--color-bg-elevated);
    box-shadow: inset 3px 0 0 0 var(--color-accent), inset 0 -1px 0 0 var(--color-border);
  }

  .row-main {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
    line-height: 100%;
  }

  .row-title-line {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    line-height: 100%;
  }

  .sku-code {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    font-weight: 700;
    color: var(--color-accent);
    line-height: 100%;
  }

  .tecido-name {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-fg);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 100%;
  }

  .tecido-comp {
    font-size: 11px;
    color: var(--color-fg-dim);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 100%;
  }

  .detail-panel {
    display: flex;
    flex-direction: column;
    min-height: 0;
    height: 100%;
    background: var(--color-bg);
  }

  .detail-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    height: 48px;
    min-height: 48px;
    padding: 0 var(--space-4);
    background: var(--color-bg-elevated);
    box-shadow: inset 0 -1px 0 0 var(--color-border);
    line-height: 100%;
  }

  .detail-info {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    line-height: 100%;
  }

  .detail-sku-badge {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    font-weight: 700;
    color: var(--color-accent);
    background: var(--color-bg-sunken);
    padding: var(--space-1) var(--space-2);
    box-shadow: inset 0 0 0 1px var(--color-border);
    line-height: 100%;
  }

  .detail-titles {
    display: flex;
    flex-direction: column;
    gap: 2px;
    line-height: 100%;
  }

  .detail-name {
    font-size: var(--text-xs);
    font-weight: 700;
    color: var(--color-fg);
    margin: 0;
    line-height: 100%;
  }

  .detail-sub {
    font-size: 11px;
    color: var(--color-fg-muted);
    line-height: 100%;
  }

  .detail-table-wrap {
    flex: 1;
    min-height: 0;
    overflow: auto;
    background: var(--color-bg);
  }

  .no-vinculos-box {
    padding: var(--space-6);
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }

  .empty-hint-pane {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--color-fg-dim);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    text-transform: uppercase;
  }

  .swatch-cell {
    display: inline-block;
    width: 14px;
    height: 14px;
    border-radius: var(--radius-sm);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.2), 0 0 0 1px var(--color-border);
    vertical-align: middle;
  }

  .cor-name-text {
    font-weight: 600;
    color: var(--color-fg);
  }

  .mono-text {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--color-fg-muted);
  }

  .cor-sku {
    color: var(--color-fg-dim);
  }

  .sku-cell {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    position: relative;
  }

  .product-sku {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    font-weight: 700;
    color: var(--color-accent);
    letter-spacing: var(--tracking-header);
  }

  .copy-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    padding: 2px;
    cursor: pointer;
    color: var(--color-fg-dim);
    position: relative;
  }

  .copy-btn:hover {
    color: var(--color-fg);
  }

  .copied-tooltip {
    position: absolute;
    left: 100%;
    margin-left: 4px;
    background: var(--color-accent);
    color: var(--color-bg);
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    padding: 2px 4px;
    white-space: nowrap;
  }

  .unlink-btn {
    background: transparent;
    border: none;
    color: var(--color-danger);
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 600;
    cursor: pointer;
    padding: 2px 4px;
    line-height: 100%;
    transition: opacity var(--motion-fast);
  }

  .unlink-btn:hover {
    opacity: 0.8;
    text-decoration: underline;
  }

  .footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    height: 40px;
    min-height: 40px;
    padding: 0 var(--space-4);
    box-shadow: inset 0 1px 0 0 var(--color-border);
    background: var(--color-bg-elevated);
    font-size: var(--text-xs);
    line-height: 100%;
    color: var(--color-fg-dim);
    letter-spacing: var(--tracking-label);
    text-transform: uppercase;
    box-sizing: border-box;
  }

  .footer-selected strong {
    color: var(--color-fg);
  }
</style>
