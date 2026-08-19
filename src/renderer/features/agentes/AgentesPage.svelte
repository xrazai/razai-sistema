<script lang="ts">
  import { onMount } from 'svelte'
  import Button from '../../design-system/controls/Button.svelte'
  import Badge from '../../design-system/data-display/Badge.svelte'
  import EmptyState from '../../design-system/compositions/EmptyState.svelte'
  import AgenteModal from './components/AgenteModal.svelte'
  import AgenteConhecimentoView from './components/AgenteConhecimentoView.svelte'
  import type { AgenteRecord } from '../../../shared/types'

  let agentes = $state<AgenteRecord[]>([])
  let isLoading = $state(true)
  let modalOpen = $state(false)
  let editingAgente = $state<AgenteRecord | null>(null)
  let selectedAgenteForKnowledge = $state<AgenteRecord | null>(null)

  async function loadAgentes() {
    isLoading = true
    try {
      agentes = await window.razai.agentes.list()
    } catch (err) {
      console.error('Erro ao listar agentes:', err)
    } finally {
      isLoading = false
    }
  }

  onMount(() => {
    loadAgentes()
  })

  function openCreate() {
    editingAgente = null
    modalOpen = true
  }

  function openEdit(ag: AgenteRecord) {
    editingAgente = ag
    modalOpen = true
  }

  function openKnowledge(ag: AgenteRecord) {
    selectedAgenteForKnowledge = ag
  }

  async function handleToggleAtivo(ag: AgenteRecord) {
    await window.razai.agentes.update(ag.id, { ativo: !ag.ativo })
    await loadAgentes()
  }

  async function handleDelete(id: string) {
    if (confirm('Tem certeza que deseja excluir este agente e toda sua base de conhecimento?')) {
      await window.razai.agentes.delete(id)
      await loadAgentes()
    }
  }

  let totalAgentes = $derived(agentes.length)
  let ativosCount = $derived(agentes.filter((a) => a.ativo).length)
  let conversasCount = $derived(agentes.reduce((acc, a) => acc + (a.conversasAtivasCount || 0), 0))

  function getCanalBadge(canal: string): { text: string; tone: 'neutral' | 'ok' | 'warn' | 'info' } {
    switch (canal) {
      case 'shopee':
        return { text: 'SHOPEE', tone: 'warn' }
      case 'whatsapp':
        return { text: 'WHATSAPP', tone: 'ok' }
      default:
        return { text: 'MANUAL', tone: 'neutral' }
    }
  }

  function getModoBadge(modo: string): { text: string; tone: 'neutral' | 'ok' | 'warn' | 'info' } {
    switch (modo) {
      case 'copiloto':
        return { text: 'CO-PILOTO', tone: 'info' }
      case 'autonomo':
        return { text: 'AUTÔNOMO', tone: 'ok' }
      default:
        return { text: 'PAUSADO', tone: 'neutral' }
    }
  }
</script>

{#if selectedAgenteForKnowledge}
  <AgenteConhecimentoView
    agente={selectedAgenteForKnowledge}
    onback={() => {
      selectedAgenteForKnowledge = null
      loadAgentes()
    }}
  />
{:else}
  <div class="agentes-page">
    <div class="kpi-bar">
      <div class="kpi-cell">
        <span class="kpi-label">TOTAL DE AGENTES</span>
        <span class="kpi-value">{totalAgentes}</span>
      </div>
      <div class="kpi-cell">
        <span class="kpi-label">AGENTES ATIVOS</span>
        <span class="kpi-value ok">{ativosCount}</span>
      </div>
      <div class="kpi-cell">
        <span class="kpi-label">MENSAGENS PENDENTES</span>
        <span class="kpi-value warn">{conversasCount}</span>
      </div>
      <div class="kpi-action-cell">
        <Button variant="primary" onclick={openCreate}>+ NOVO AGENTE</Button>
      </div>
    </div>

    <div class="table-container">
      {#if isLoading}
        <div class="empty-wrap">
          <EmptyState title="Carregando Agentes..." description="Aguarde um instante." />
        </div>
      {:else if agentes.length === 0}
        <div class="empty-wrap">
          <EmptyState
            title="Nenhum agente cadastrado"
            description="Crie seu primeiro agente de atendimento para configurar o tom de voz, regras de conhecimento e canal de integração."
          />
        </div>
      {:else}
        <table class="grid-table">
          <thead>
            <tr>
              <th style="width: 90px;">ID</th>
              <th>NOME & PAPEL</th>
              <th style="width: 120px;">CANAL</th>
              <th style="width: 130px;">MÉTODO</th>
              <th style="width: 130px;">OPERAÇÃO</th>
              <th style="width: 110px;">REGRAS / FAQ</th>
              <th style="width: 100px;">STATUS</th>
              <th style="width: 260px; text-align: right;">AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {#each agentes as ag (ag.id)}
              {@const canalBadge = getCanalBadge(ag.canal)}
              {@const modoBadge = getModoBadge(ag.modoOperacao)}
              <tr class:inactive={!ag.ativo}>
                <td class="mono">{ag.id}</td>
                <td>
                  <div class="name-cell">
                    <span class="agent-name">{ag.nome}</span>
                    {#if ag.descricao}
                      <span class="agent-desc">{ag.descricao}</span>
                    {/if}
                  </div>
                </td>
                <td>
                  <Badge text={canalBadge.text} tone={canalBadge.tone} />
                </td>
                <td class="mono font-xs">
                  {ag.tipoConexao === 'web_session' ? 'WEB SESSION' : 'REST API'}
                </td>
                <td>
                  <Badge text={modoBadge.text} tone={modoBadge.tone} />
                </td>
                <td class="mono font-xs">
                  {ag.conhecimentosCount ?? 0} itens
                </td>
                <td>
                  <Badge text={ag.ativo ? 'ONLINE' : 'OFFLINE'} tone={ag.ativo ? 'ok' : 'neutral'} />
                </td>
                <td class="actions-cell">
                  <button
                    class="btn-action"
                    onclick={() => openKnowledge(ag)}
                    title="Gerenciar Base de Conhecimento"
                  >
                    📚 CONHECIMENTO
                  </button>
                  <button class="btn-action" onclick={() => openEdit(ag)} title="Configurar Agente">
                    ⚙ CONFIG
                  </button>
                  <button
                    class="btn-action"
                    onclick={() => handleToggleAtivo(ag)}
                    title={ag.ativo ? 'Pausar agente' : 'Ativar agente'}
                  >
                    {ag.ativo ? '⏸' : '▶'}
                  </button>
                  <button
                    class="btn-action danger"
                    onclick={() => handleDelete(ag.id)}
                    title="Excluir agente"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>
  </div>
{/if}

{#if modalOpen}
  <AgenteModal
    agente={editingAgente}
    onclose={() => (modalOpen = false)}
    onsave={async () => {
      modalOpen = false
      await loadAgentes()
    }}
  />
{/if}

<style>
  .agentes-page {
    display: flex;
    flex-direction: column;
    height: 100%;
    box-sizing: border-box;
  }

  .kpi-bar {
    display: grid;
    grid-template-columns: repeat(3, 180px) 1fr;
    height: 48px;
    box-shadow: inset 0 -1px 0 0 var(--color-border);
    background: var(--color-bg-elevated);
    box-sizing: border-box;
  }

  .kpi-cell {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 var(--space-3);
    box-shadow: inset -1px 0 0 0 var(--color-border);
    box-sizing: border-box;
    line-height: 100%;
  }

  .kpi-label {
    font-size: var(--text-xs);
    color: var(--color-fg-muted);
    letter-spacing: var(--tracking-label);
    margin-bottom: var(--space-1);
    line-height: 100%;
  }

  .kpi-value {
    font-size: var(--text-sm);
    font-weight: 600;
    font-family: var(--font-mono);
    color: var(--color-fg);
    line-height: 100%;
  }

  .kpi-value.ok {
    color: var(--color-ok);
  }

  .kpi-value.warn {
    color: var(--color-warn);
  }

  .kpi-action-cell {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 0 var(--space-3);
    box-sizing: border-box;
  }

  .table-container {
    flex: 1;
    overflow-y: auto;
    box-sizing: border-box;
  }

  .empty-wrap {
    padding: var(--space-6) 0;
  }

  .grid-table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--text-xs);
    box-sizing: border-box;
  }

  .grid-table th {
    height: 40px;
    padding: 0 var(--space-3);
    text-align: left;
    font-size: var(--text-xs);
    font-weight: 600;
    letter-spacing: var(--tracking-label);
    color: var(--color-fg-muted);
    background: var(--color-bg-elevated);
    box-shadow: inset 0 -1px 0 0 var(--color-border), inset -1px 0 0 0 var(--color-border);
    box-sizing: border-box;
    line-height: 100%;
  }

  .grid-table th:last-child {
    box-shadow: inset 0 -1px 0 0 var(--color-border);
  }

  .grid-table td {
    height: 40px;
    padding: 0 var(--space-3);
    color: var(--color-fg);
    box-shadow: inset 0 -1px 0 0 var(--color-border), inset -1px 0 0 0 var(--color-border);
    box-sizing: border-box;
    line-height: 100%;
  }

  .grid-table td:last-child {
    box-shadow: inset 0 -1px 0 0 var(--color-border);
  }

  .grid-table tr:hover td {
    background: var(--color-bg-elevated);
  }

  .grid-table tr.inactive {
    opacity: 0.5;
  }

  .mono {
    font-family: var(--font-mono);
  }

  .font-xs {
    font-size: var(--text-xs);
    color: var(--color-fg-muted);
  }

  .name-cell {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .agent-name {
    font-weight: 600;
    color: var(--color-fg);
  }

  .agent-desc {
    font-size: 11px;
    color: var(--color-fg-muted);
  }

  .actions-cell {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--space-1);
    height: 40px;
  }

  .btn-action {
    height: 24px;
    padding: 0 var(--space-2);
    background: var(--color-bg);
    border: var(--border-width) solid var(--color-border);
    color: var(--color-fg-muted);
    font-family: inherit;
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-label);
    cursor: pointer;
    line-height: 100%;
    box-sizing: border-box;
  }

  .btn-action:hover {
    color: var(--color-fg);
    border-color: var(--color-fg);
  }

  .btn-action.danger:hover {
    color: var(--color-danger);
    border-color: var(--color-danger);
  }
</style>
