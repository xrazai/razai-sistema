<script lang="ts">
  import { onMount } from 'svelte'
  import Icon from '../../design-system/primitives/Icon.svelte'
  import Button from '../../design-system/controls/Button.svelte'
  import Badge from '../../design-system/data-display/Badge.svelte'
  import TecidoTile from './components/TecidoTile.svelte'
  import CorTile from './components/CorTile.svelte'
  import type { TecidoRecord, CorRecord, VinculoRecord } from '../../../shared/types'
  import { normalizeUnaccent } from '../../../shared/sku'

  type Props = {
    initialTecidoId?: string
    oncancel: () => void
    onsave: (tecidoId: string, corIds: string[]) => Promise<void>
  }

  let { initialTecidoId, oncancel, onsave }: Props = $props()

  let tecidos = $state<TecidoRecord[]>([])
  let cores = $state<CorRecord[]>([])
  let existingVinculos = $state<VinculoRecord[]>([])

  let selectedTecidoId = $state<string>('')
  let selectedCorIds = $state<Set<string>>(new Set())

  let tecidoSearch = $state('')
  let corSearch = $state('')

  let isLoading = $state(true)
  let isSaving = $state(false)
  let errorMsg = $state<string | null>(null)

  // Carrega lista de tecidos e cores
  async function loadInitialData() {
    isLoading = true
    errorMsg = null
    try {
      if (typeof window !== 'undefined' && window.razai) {
        const [tecList, corList] = await Promise.all([
          window.razai.tecidos.list(),
          window.razai.cores.list()
        ])
        tecidos = tecList
        cores = corList

        if (initialTecidoId && tecList.some((t) => t.id === initialTecidoId)) {
          selectedTecidoId = initialTecidoId
          await loadExistingVinculos(initialTecidoId)
        } else if (tecList.length > 0 && !selectedTecidoId) {
          selectedTecidoId = tecList[0].id
          await loadExistingVinculos(tecList[0].id)
        }
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err)
      errorMsg = err?.message || 'Falha ao carregar tecidos e cores.'
    } finally {
      isLoading = false
    }
  }

  async function loadExistingVinculos(tId: string) {
    if (!tId) {
      existingVinculos = []
      return
    }
    try {
      if (typeof window !== 'undefined' && window.razai?.vinculos) {
        existingVinculos = await window.razai.vinculos.listByTecido(tId)
      }
    } catch (err) {
      console.error('Erro ao buscar vínculos do tecido:', err)
    }
  }

  onMount(() => {
    loadInitialData()
  })

  // Efeito ao trocar de tecido: limpa seleção e busca vínculos existentes do tecido selecionado
  $effect(() => {
    const tId = selectedTecidoId
    if (tId) {
      selectedCorIds = new Set()
      loadExistingVinculos(tId)
    }
  })

  let selectedTecido = $derived(tecidos.find((t) => t.id === selectedTecidoId) || null)

  let existingCorIdsSet = $derived.by(() => {
    return new Set(existingVinculos.map((v) => v.corId))
  })

  // Filtro de Tecidos
  let filteredTecidos = $derived.by(() => {
    const term = normalizeUnaccent(tecidoSearch.trim())
    if (!term) return tecidos
    return tecidos.filter((t) => {
      const c = normalizeUnaccent(t.codigo)
      const n = normalizeUnaccent(t.nome)
      const comp = normalizeUnaccent(t.composicao)
      return c.includes(term) || n.includes(term) || comp.includes(term)
    })
  })

  // Filtro e Ordenação Alfabética de Cores
  let filteredCores = $derived.by(() => {
    const sorted = [...cores].sort((a, b) =>
      a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })
    )
    const term = normalizeUnaccent(corSearch.trim())
    if (!term) return sorted
    return sorted.filter((c) => {
      const cod = normalizeUnaccent(c.codigo)
      const n = normalizeUnaccent(c.nome)
      const h = normalizeUnaccent(c.hex)
      return cod.includes(term) || n.includes(term) || h.includes(term)
    })
  })

  // Cores disponíveis para marcar (que ainda não foram vinculadas)
  let availableCores = $derived(
    filteredCores.filter((c) => !existingCorIdsSet.has(c.id))
  )

  function handleSelectTecido(id: string) {
    selectedTecidoId = id
  }

  function toggleCor(id: string) {
    if (existingCorIdsSet.has(id)) return
    const next = new Set(selectedCorIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    selectedCorIds = next
  }

  function handleSelectAllAvailable() {
    const next = new Set(selectedCorIds)
    for (const cor of availableCores) {
      next.add(cor.id)
    }
    selectedCorIds = next
  }

  function handleClearCorSelection() {
    selectedCorIds = new Set()
  }

  async function handleSave() {
    if (!selectedTecidoId || selectedCorIds.size === 0 || isSaving) return
    isSaving = true
    errorMsg = null
    try {
      await onsave(selectedTecidoId, Array.from(selectedCorIds))
    } catch (err: any) {
      console.error('Erro ao salvar vínculos:', err)
      errorMsg = err?.message || 'Falha ao salvar vínculos.'
    } finally {
      isSaving = false
    }
  }

  let saveButtonLabel = $derived.by(() => {
    if (isSaving) return 'Salvando vínculos...'
    const count = selectedCorIds.size
    if (count <= 1) return 'Criar vínculo'
    return `Criar vínculos (${count})`
  })
</script>

<div class="cadastro-page">
  <!-- Container rolável principal com as 2 seções -->
  <div class="sections-container">
    <!-- SEÇÃO 1: SELEÇÃO DO TECIDO BASE -->
    <section class="section">
      <div class="section-header">
        <div class="section-title-group">
          <span class="step-num">1</span>
          <h2 class="section-title">SELECIONE O TECIDO BASE</h2>
          <span class="selection-rule">(SELEÇÃO ÚNICA)</span>
        </div>

        <div class="section-tools">
          <div class="mini-search">
            <Icon name="search" size="sm" />
            <input
              type="text"
              class="search-input"
              bind:value={tecidoSearch}
              placeholder="Buscar tecido por nome ou SKU..."
            />
            {#if tecidoSearch}
              <button class="clear-btn" onclick={() => (tecidoSearch = '')} aria-label="Limpar busca">
                ✕
              </button>
            {/if}
          </div>
          <Badge
            text={`${filteredTecidos.length} ${filteredTecidos.length === 1 ? 'tecido' : 'tecidos'}`}
            tone="neutral"
          />
        </div>
      </div>

      <div class="grid-area">
        {#if filteredTecidos.length === 0}
          <div class="empty-hint">
            <span>Nenhum tecido encontrado para "{tecidoSearch}".</span>
          </div>
        {:else}
          <div class="tiles-grid">
            {#each filteredTecidos as tecido (tecido.id)}
              <TecidoTile
                {tecido}
                selected={selectedTecidoId === tecido.id}
                onclick={() => handleSelectTecido(tecido.id)}
              />
            {/each}
          </div>
        {/if}
      </div>
    </section>

    <!-- SEÇÃO 2: SELEÇÃO DAS CORES DA CARTELA -->
    <section class="section">
      <div class="section-header">
        <div class="section-title-group">
          <span class="step-num">2</span>
          <h2 class="section-title">SELECIONE AS CORES DA CARTELA</h2>
          <span class="selection-rule">(SELEÇÃO MÚLTIPLA • ORDEM ALFABÉTICA)</span>
        </div>

        <div class="section-tools">
          <div class="mini-search">
            <Icon name="search" size="sm" />
            <input
              type="text"
              class="search-input"
              bind:value={corSearch}
              placeholder="Buscar cor por nome, SKU ou HEX..."
              disabled={!selectedTecidoId}
            />
            {#if corSearch}
              <button class="clear-btn" onclick={() => (corSearch = '')} aria-label="Limpar busca">
                ✕
              </button>
            {/if}
          </div>

          {#if selectedTecidoId && availableCores.length > 0}
            <button
              type="button"
              class="tool-btn"
              onclick={handleSelectAllAvailable}
            >
              Marcar Disponíveis ({availableCores.length})
            </button>
          {/if}

          {#if selectedCorIds.size > 0}
            <button
              type="button"
              class="tool-btn"
              onclick={handleClearCorSelection}
            >
              Limpar Seleção
            </button>
          {/if}

          <Badge
            text={`${selectedCorIds.size} selecionadas`}
            tone={selectedCorIds.size > 0 ? 'ok' : 'neutral'}
          />
        </div>
      </div>

      <div class="grid-area">
        {#if !selectedTecidoId}
          <div class="empty-hint">
            <span>Selecione um tecido base na Seção 1 para liberar a cartela de cores.</span>
          </div>
        {:else if filteredCores.length === 0}
          <div class="empty-hint">
            <span>Nenhuma cor encontrada para "{corSearch}".</span>
          </div>
        {:else}
          <div class="tiles-grid">
            {#each filteredCores as cor (cor.id)}
              <CorTile
                {cor}
                selected={selectedCorIds.has(cor.id)}
                alreadyLinked={existingCorIdsSet.has(cor.id)}
                onclick={() => toggleCor(cor.id)}
              />
            {/each}
          </div>
        {/if}
      </div>
    </section>
  </div>

  <!-- RODAPÉ MODULAR FIXO (40PX) -->
  <footer class="footer">
    <div class="footer-summary">
      {#if errorMsg}
        <Badge text={errorMsg} tone="danger" />
      {:else if !selectedTecido}
        <span class="footer-hint">Selecione um tecido base para começar</span>
      {:else if selectedCorIds.size === 0}
        <span class="footer-info">
          Tecido: <strong>{selectedTecido.codigo} — {selectedTecido.nome}</strong> • Nenhuma nova cor selecionada
        </span>
      {:else}
        <span class="footer-info">
          Tecido: <strong>{selectedTecido.codigo}</strong> •
          <strong>{selectedCorIds.size} {selectedCorIds.size === 1 ? 'cor selecionada' : 'cores selecionadas'}</strong>
          → {selectedCorIds.size} {selectedCorIds.size === 1 ? 'novo produto vendável' : 'novos produtos vendáveis'}
        </span>
      {/if}
    </div>

    <div class="footer-actions">
      <Button variant="ghost" size="sm" onclick={oncancel} disabled={isSaving}>
        <span>Cancelar</span>
      </Button>

      <Button
        variant="primary"
        size="sm"
        onclick={handleSave}
        disabled={!selectedTecidoId || selectedCorIds.size === 0 || isSaving}
      >
        <Icon name="link" size="sm" />
        <span>{saveButtonLabel}</span>
      </Button>
    </div>
  </footer>
</div>

<style>
  .cadastro-page {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    width: 100%;
    background: var(--color-bg);
    line-height: 100%;
    box-sizing: border-box;
  }

  .sections-container {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  .section {
    display: flex;
    flex-direction: column;
    width: 100%;
    box-shadow: inset 0 -1px 0 0 var(--color-border);
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    height: 40px;
    min-height: 40px;
    padding: 0 var(--space-4);
    background: var(--color-bg-sunken);
    box-shadow: inset 0 -1px 0 0 var(--color-border);
    box-sizing: border-box;
    line-height: 100%;
  }

  .section-title-group {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    line-height: 100%;
  }

  .step-num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    background: var(--color-accent);
    color: var(--color-bg);
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    line-height: 100%;
  }

  .section-title {
    font-size: var(--text-xs);
    font-weight: 700;
    letter-spacing: var(--tracking-header);
    color: var(--color-fg);
    margin: 0;
    line-height: 100%;
  }

  .selection-rule {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--color-fg-dim);
    letter-spacing: var(--tracking-label);
    line-height: 100%;
  }

  .section-tools {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    line-height: 100%;
  }

  .mini-search {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    width: 260px;
    height: 28px;
    padding: 0 var(--space-2);
    background: var(--color-bg);
    box-shadow: inset 0 0 0 1px var(--color-border);
    color: var(--color-fg-muted);
    box-sizing: border-box;
    line-height: 100%;
  }

  .mini-search:focus-within {
    box-shadow: inset 0 0 0 1px var(--color-border-strong);
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
    font-size: 10px;
    line-height: 100%;
    cursor: pointer;
    padding: 2px;
  }

  .clear-btn:hover {
    color: var(--color-fg);
  }

  .tool-btn {
    height: 28px;
    padding: 0 var(--space-2);
    background: var(--color-bg);
    box-shadow: inset 0 0 0 1px var(--color-border);
    border: none;
    color: var(--color-fg-muted);
    font-family: var(--font-mono);
    font-size: 11px;
    cursor: pointer;
    line-height: 100%;
    transition: background var(--motion-fast), color var(--motion-fast);
  }

  .tool-btn:hover {
    background: var(--color-bg-elevated);
    color: var(--color-fg);
    box-shadow: inset 0 0 0 1px var(--color-border-strong);
  }

  .grid-area {
    padding: var(--space-3) var(--space-4);
    background: var(--color-bg);
    min-height: 140px;
  }

  .tiles-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: var(--space-2);
  }

  .empty-hint {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100px;
    color: var(--color-fg-dim);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-label);
    line-height: 100%;
    text-transform: uppercase;
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
    box-sizing: border-box;
    line-height: 100%;
  }

  .footer-summary {
    display: flex;
    align-items: center;
    line-height: 100%;
  }

  .footer-hint {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--color-fg-dim);
    letter-spacing: var(--tracking-label);
    text-transform: uppercase;
    line-height: 100%;
  }

  .footer-info {
    font-size: var(--text-xs);
    color: var(--color-fg-muted);
    line-height: 100%;
  }

  .footer-info strong {
    color: var(--color-fg);
  }

  .footer-actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    line-height: 100%;
  }
</style>
