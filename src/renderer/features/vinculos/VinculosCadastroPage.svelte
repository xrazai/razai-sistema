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
    onsave: (tecidoId: string, corIds: string[]) => void | Promise<void>
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
  let erroMsg = $state<string | null>(null)

  // Carrega lista de tecidos e cores
  async function loadInitialData() {
    isLoading = true
    erroMsg = null
    try {
      if (typeof window !== 'undefined' && window.razai) {
        const [tecList, corList] = await Promise.all([
          window.razai.tecidos?.list ? window.razai.tecidos.list() : Promise.resolve([]),
          window.razai.cores?.list ? window.razai.cores.list() : Promise.resolve([])
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
      erroMsg = err?.message || 'Falha ao carregar tecidos e cores.'
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

  // Ao trocar de tecido: limpa seleção de cores e busca os vínculos existentes do tecido selecionado
  $effect(() => {
    const tId = selectedTecidoId
    if (tId) {
      selectedCorIds = new Set()
      loadExistingVinculos(tId)
    }
  })

  let selectedTecido = $derived(tecidos.find((t) => String(t.id) === String(selectedTecidoId)) || null)

  let existingCorIdsSet = $derived.by(() => {
    return new Set(existingVinculos.map((v) => String(v.corId)))
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
    filteredCores.filter((c) => !existingCorIdsSet.has(String(c.id)))
  )

  function handleSelectTecido(id: string) {
    selectedTecidoId = String(id)
  }

  function toggleCor(id: string) {
    const sId = String(id)
    if (existingCorIdsSet.has(sId)) return
    const next = new Set(selectedCorIds)
    if (next.has(sId)) {
      next.delete(sId)
    } else {
      next.add(sId)
    }
    selectedCorIds = next
  }

  function handleSelectAllAvailable() {
    const next = new Set(selectedCorIds)
    for (const cor of availableCores) {
      next.add(String(cor.id))
    }
    selectedCorIds = next
  }

  function handleClearCorSelection() {
    selectedCorIds = new Set()
  }

  async function handleSubmit() {
    if (!selectedTecidoId) {
      erroMsg = 'Selecione um tecido base na Seção 01.'
      return
    }

    if (selectedCorIds.size === 0) {
      erroMsg = 'Selecione ao menos uma cor na Seção 02 para criar o vínculo.'
      return
    }

    erroMsg = ''
    isSaving = true
    try {
      await onsave(selectedTecidoId, Array.from(selectedCorIds))
    } catch (err: any) {
      console.error('Erro ao salvar vínculos:', err)
      erroMsg = err?.message || 'Falha ao salvar vínculos.'
    } finally {
      isSaving = false
    }
  }

  let saveButtonLabel = $derived.by(() => {
    if (isSaving) return 'Salvando...'
    const count = selectedCorIds.size
    if (count <= 1) return 'Salvar Vínculo'
    return `Salvar Vínculos (${count})`
  })
</script>

<div class="cadastro-page">
  <div class="content-scroll">
    <div class="form-wrapper">
      <form class="form-body" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <div class="grid-form">
          <!-- SEÇÃO 01: SELEÇÃO DO TECIDO BASE -->
          <div class="section-row">
            <header class="section-head">
              <span>01. Seleção do Tecido Base</span>
              {#if erroMsg && !selectedTecidoId}
                <Badge text={erroMsg} tone="danger" />
              {:else}
                <span class="head-rule">Seleção única • Artigo base da matriz</span>
              {/if}
            </header>

            <div class="section-toolbar">
              <div class="search-box">
                <Icon name="search" size="sm" />
                <input
                  type="text"
                  class="search-input"
                  bind:value={tecidoSearch}
                  placeholder="Buscar tecido por SKU, nome ou composição..."
                />
                {#if tecidoSearch}
                  <button class="clear-btn" onclick={() => (tecidoSearch = '')} aria-label="Limpar busca">
                    ✕
                  </button>
                {/if}
              </div>

              <div class="toolbar-meta">
                {#if selectedTecido}
                  <Badge text={`Tecido selecionado: ${selectedTecido.codigo}`} tone="ok" />
                {/if}
                <Badge
                  text={`${filteredTecidos.length} ${filteredTecidos.length === 1 ? 'tecido disponível' : 'tecidos disponíveis'}`}
                  tone="neutral"
                />
              </div>
            </div>

            <div class="field-grid-cell">
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
          </div>

          <!-- SEÇÃO 02: SELEÇÃO DAS CORES DA CARTELA -->
          <div class="section-row">
            <header class="section-head">
              <span>02. Seleção das Cores da Cartela</span>
              {#if erroMsg && selectedTecidoId && selectedCorIds.size === 0}
                <Badge text={erroMsg} tone="danger" />
              {:else}
                <span class="head-rule">Seleção múltipla • Ordem alfabética</span>
              {/if}
            </header>

            <div class="section-toolbar">
              <div class="search-box">
                <Icon name="search" size="sm" />
                <input
                  type="text"
                  class="search-input"
                  bind:value={corSearch}
                  placeholder="Buscar cor por SKU, nome ou HEX..."
                  disabled={!selectedTecidoId}
                />
                {#if corSearch}
                  <button class="clear-btn" onclick={() => (corSearch = '')} aria-label="Limpar busca">
                    ✕
                  </button>
                {/if}
              </div>

              <div class="toolbar-meta">
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

            <div class="field-grid-cell">
              {#if !selectedTecidoId}
                <div class="empty-hint">
                  <span>Selecione um tecido base na Seção 01 para liberar a cartela de cores.</span>
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
          </div>
        </div>
      </form>

      <!-- BARRA DE RODAPÉ COM AÇÕES EM LARGURA TOTAL -->
      <footer class="form-footer">
        <div class="footer-summary">
          {#if !selectedTecido}
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
          <Button variant="ghost" onclick={oncancel} disabled={isSaving}>
            Cancelar
          </Button>

          <Button
            variant="primary"
            onclick={handleSubmit}
            disabled={!selectedTecidoId || selectedCorIds.size === 0 || isSaving}
          >
            <span>{saveButtonLabel}</span>
          </Button>
        </div>
      </footer>
    </div>
  </div>
</div>

<style>
  .cadastro-page {
    height: 100%;
    min-height: 0;
    display: grid;
    width: 100%;
    line-height: 100%;
  }

  .content-scroll {
    height: 100%;
    overflow-y: auto;
    background: var(--color-bg);
    width: 100%;
  }

  .form-wrapper {
    display: flex;
    flex-direction: column;
    width: 100%;
    box-sizing: border-box;
  }

  .grid-form {
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  .section-row {
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  .section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 40px;
    min-height: 40px;
    padding: var(--space-2) var(--space-4);
    background: var(--color-bg-elevated);
    box-shadow: inset 0 -1px 0 0 var(--color-border);
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-header);
    text-transform: uppercase;
    color: var(--color-fg-dim);
    font-family: var(--font-mono);
    box-sizing: border-box;
    line-height: 100%;
  }

  .head-rule {
    font-size: var(--text-xs);
    color: var(--color-fg-dim);
    letter-spacing: var(--tracking-tight);
    text-transform: none;
  }

  .section-toolbar {
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
    max-width: 440px;
    height: 100%;
    padding: var(--space-2) var(--space-3);
    border: none;
    box-shadow: inset -1px 0 0 0 var(--color-border);
    background: var(--color-bg);
    color: var(--color-fg-muted);
    box-sizing: border-box;
    line-height: 100%;
    transition: background var(--motion-fast), box-shadow var(--motion-fast);
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

  .field-grid-cell {
    padding: var(--space-3) var(--space-4) var(--space-6) var(--space-4);
    background: var(--color-bg);
    width: 100%;
    box-sizing: border-box;
    box-shadow: inset 0 -1px 0 0 var(--color-border);
  }

  .tiles-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: var(--space-2);
    width: 100%;
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

  .form-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    height: 80px;
    min-height: 56px;
    padding: var(--space-3) var(--space-4);
    background: var(--color-bg-elevated);
    box-shadow: inset 0 1px 0 0 var(--color-border);
    width: 100%;
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
    gap: var(--space-3);
    line-height: 100%;
  }
</style>
