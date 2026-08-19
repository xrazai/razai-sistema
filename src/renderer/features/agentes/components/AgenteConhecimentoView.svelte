<script lang="ts">
  import { onMount } from 'svelte'
  import Button from '../../../design-system/controls/Button.svelte'
  import Badge from '../../../design-system/data-display/Badge.svelte'
  import Input from '../../../design-system/controls/Input.svelte'
  import EmptyState from '../../../design-system/compositions/EmptyState.svelte'
  import ConhecimentoModal from './ConhecimentoModal.svelte'
  import type { AgenteRecord, AgenteConhecimentoRecord } from '../../../../shared/types'

  type Props = {
    agente: AgenteRecord
    onback: () => void
  }

  let { agente, onback }: Props = $props()

  let conhecimentos = $state<AgenteConhecimentoRecord[]>([])
  let isLoading = $state(true)
  let searchTerm = $state('')
  let selectedTipo = $state<'todos' | 'faq' | 'politica' | 'manual_produto' | 'texto_livre'>('todos')

  let modalOpen = $state(false)
  let editingItem = $state<AgenteConhecimentoRecord | null>(null)

  async function loadData() {
    isLoading = true
    try {
      conhecimentos = await window.razai.agentes.listConhecimentos(agente.id)
    } catch (err) {
      console.error('Erro ao carregar conhecimentos:', err)
    } finally {
      isLoading = false
    }
  }

  onMount(() => {
    loadData()
  })

  let filteredItems = $derived.by(() => {
    return conhecimentos.filter((c) => {
      if (selectedTipo !== 'todos' && c.tipo !== selectedTipo) return false
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase()
        return (
          c.titulo.toLowerCase().includes(term) ||
          c.conteudo.toLowerCase().includes(term)
        )
      }
      return true
    })
  })

  function openCreate() {
    editingItem = null
    modalOpen = true
  }

  function openEdit(item: AgenteConhecimentoRecord) {
    editingItem = item
    modalOpen = true
  }

  async function handleDelete(id: string) {
    if (confirm('Tem certeza que deseja remover este item de conhecimento?')) {
      await window.razai.agentes.deleteConhecimento(id)
      await loadData()
    }
  }

  async function handleToggleAtivo(item: AgenteConhecimentoRecord) {
    await window.razai.agentes.updateConhecimento(item.id, { ativo: !item.ativo })
    await loadData()
  }

  function getTipoBadge(tipo: string): { text: string; tone: 'neutral' | 'ok' | 'warn' | 'info' } {
    switch (tipo) {
      case 'faq':
        return { text: 'FAQ', tone: 'info' }
      case 'politica':
        return { text: 'POLÍTICA', tone: 'warn' }
      case 'manual_produto':
        return { text: 'MANUAL', tone: 'ok' }
      default:
        return { text: 'TEXTO', tone: 'neutral' }
    }
  }
</script>

<div class="knowledge-view">
  <div class="toolbar">
    <div class="toolbar-left">
      <Button variant="secondary" onclick={onback}>← VOLTAR AOS AGENTES</Button>
      <div class="title-tag">
        <span class="muted">AGENTE:</span>
        <span class="name">{agente.nome}</span>
      </div>
    </div>
    <div class="toolbar-right">
      <Button variant="primary" onclick={openCreate}>+ NOVO ITEM DE CONHECIMENTO</Button>
    </div>
  </div>

  <div class="filter-bar">
    <div class="search-box">
      <Input bind:value={searchTerm} placeholder="Filtrar por título ou conteúdo..." />
    </div>
    <div class="type-pills">
      <button
        class="pill-btn"
        class:active={selectedTipo === 'todos'}
        onclick={() => (selectedTipo = 'todos')}
      >
        TODOS ({conhecimentos.length})
      </button>
      <button
        class="pill-btn"
        class:active={selectedTipo === 'faq'}
        onclick={() => (selectedTipo = 'faq')}
      >
        FAQS
      </button>
      <button
        class="pill-btn"
        class:active={selectedTipo === 'politica'}
        onclick={() => (selectedTipo = 'politica')}
      >
        POLÍTICAS
      </button>
      <button
        class="pill-btn"
        class:active={selectedTipo === 'manual_produto'}
        onclick={() => (selectedTipo = 'manual_produto')}
      >
        MANUAIS
      </button>
      <button
        class="pill-btn"
        class:active={selectedTipo === 'texto_livre'}
        onclick={() => (selectedTipo = 'texto_livre')}
      >
        DOCUMENTOS
      </button>
    </div>
  </div>

  <div class="content-body">
    {#if isLoading}
      <div class="empty-wrap">
        <EmptyState title="Carregando Base de Conhecimento..." description="Aguarde um instante." />
      </div>
    {:else if filteredItems.length === 0}
      <div class="empty-wrap">
        <EmptyState
          title="Nenhum item encontrado"
          description={conhecimentos.length === 0
            ? 'Este agente ainda não possui regras ou FAQs cadastradas. Clique em "+ Novo Item de Conhecimento" para começar.'
            : 'Nenhum resultado corresponde aos filtros aplicados.'}
        />
      </div>
    {:else}
      <div class="knowledge-grid">
        {#each filteredItems as item (item.id)}
          {@const badge = getTipoBadge(item.tipo)}
          <div class="knowledge-card" class:inactive={!item.ativo}>
            <div class="card-head">
              <div class="head-tags">
                <Badge text={badge.text} tone={badge.tone} />
                <Badge text={item.ativo ? 'ATIVA' : 'PAUSADA'} tone={item.ativo ? 'ok' : 'neutral'} />
              </div>
              <div class="card-actions">
                <button
                  class="action-btn"
                  onclick={() => handleToggleAtivo(item)}
                  title={item.ativo ? 'Pausar regra' : 'Ativar regra'}
                >
                  {item.ativo ? '⏸' : '▶'}
                </button>
                <button class="action-btn" onclick={() => openEdit(item)} title="Editar item">
                  ✏
                </button>
                <button
                  class="action-btn danger"
                  onclick={() => handleDelete(item.id)}
                  title="Excluir item"
                >
                  ✕
                </button>
              </div>
            </div>

            <div class="card-title">{item.titulo}</div>
            <div class="card-content">{item.conteudo}</div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

{#if modalOpen}
  <ConhecimentoModal
    agenteId={agente.id}
    conhecimento={editingItem}
    onclose={() => (modalOpen = false)}
    onsave={async () => {
      modalOpen = false
      await loadData()
    }}
  />
{/if}

<style>
  .knowledge-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    box-sizing: border-box;
  }

  .toolbar {
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--space-3);
    box-shadow: inset 0 -1px 0 0 var(--color-border);
    background: var(--color-bg-elevated);
    box-sizing: border-box;
  }

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .title-tag {
    font-size: var(--text-xs);
    line-height: 100%;
  }

  .title-tag .muted {
    color: var(--color-fg-muted);
    letter-spacing: var(--tracking-label);
  }

  .title-tag .name {
    color: var(--color-fg);
    font-weight: 600;
  }

  .filter-bar {
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--space-3);
    box-shadow: inset 0 -1px 0 0 var(--color-border);
    background: var(--color-bg);
    box-sizing: border-box;
  }

  .search-box {
    width: 320px;
  }

  .type-pills {
    display: flex;
    gap: var(--space-1);
  }

  .pill-btn {
    height: 24px;
    padding: 0 var(--space-2);
    background: var(--color-bg-elevated);
    border: var(--border-width) solid var(--color-border);
    color: var(--color-fg-muted);
    font-family: inherit;
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-label);
    cursor: pointer;
    line-height: 100%;
    box-sizing: border-box;
  }

  .pill-btn:hover {
    color: var(--color-fg);
  }

  .pill-btn.active {
    background: var(--color-fg);
    color: var(--color-bg);
    border-color: var(--color-fg);
    font-weight: 600;
  }

  .content-body {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-3);
    box-sizing: border-box;
  }

  .empty-wrap {
    padding: var(--space-6) 0;
  }

  .knowledge-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
    gap: var(--space-3);
  }

  .knowledge-card {
    border: var(--border-width) solid var(--color-border);
    background: var(--color-bg-elevated);
    display: flex;
    flex-direction: column;
    padding: var(--space-3);
    gap: var(--space-2);
    box-sizing: border-box;
  }

  .knowledge-card.inactive {
    opacity: 0.5;
  }

  .card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .head-tags {
    display: flex;
    gap: var(--space-2);
  }

  .card-actions {
    display: flex;
    gap: var(--space-1);
  }

  .action-btn {
    width: 24px;
    height: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--color-bg);
    border: var(--border-width) solid var(--color-border);
    color: var(--color-fg-muted);
    font-family: inherit;
    font-size: var(--text-xs);
    cursor: pointer;
    padding: 0;
    line-height: 100%;
    box-sizing: border-box;
  }

  .action-btn:hover {
    color: var(--color-fg);
    border-color: var(--color-fg);
  }

  .action-btn.danger:hover {
    color: var(--color-danger);
    border-color: var(--color-danger);
  }

  .card-title {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-fg);
    line-height: 140%;
  }

  .card-content {
    font-size: var(--text-xs);
    color: var(--color-fg-muted);
    line-height: 140%;
    white-space: pre-wrap;
    max-height: 120px;
    overflow-y: auto;
  }
</style>
