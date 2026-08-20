<script lang="ts">
  import { onMount } from 'svelte'
  import Button from '../../../design-system/controls/Button.svelte'
  import Badge from '../../../design-system/data-display/Badge.svelte'
  import EmptyState from '../../../design-system/compositions/EmptyState.svelte'
  import type {
    AgenteRecord,
    AgenteConversaRecord,
    AgenteMensagemRecord
  } from '../../../../shared/types'

  type Props = {
    agente: AgenteRecord
    onback: () => void
  }

  let { agente, onback }: Props = $props()

  let conversas = $state<AgenteConversaRecord[]>([])
  let selectedConversaId = $state<string | null>(null)
  let selectedConversa = $state<AgenteConversaRecord | null>(null)
  let mensagens = $state<AgenteMensagemRecord[]>([])
  let isLoadingConversas = $state(true)
  let isLoadingMensagens = $state(false)

  let inputTextoManual = $state('')
  let sugestaoTextoEditavel = $state('')
  let pendingSugestaoMsg = $state<AgenteMensagemRecord | null>(null)
  let isSending = $state(false)
  let isRegenerating = $state(false)

  async function loadConversas() {
    isLoadingConversas = true
    try {
      conversas = await window.razai.agentes.listConversas(agente.id)
      if (conversas.length > 0 && !selectedConversaId) {
        selectConversa(conversas[0].id)
      }
    } catch (err) {
      console.error('Erro ao listar conversas:', err)
    } finally {
      isLoadingConversas = false
    }
  }

  async function selectConversa(conversaId: string) {
    selectedConversaId = conversaId
    isLoadingMensagens = true
    try {
      selectedConversa = await window.razai.agentes.getConversa(conversaId)
      mensagens = await window.razai.agentes.listMensagens(conversaId)

      // Identifica a última sugestão pendente do agente se houver
      const pending = mensagens
        .slice()
        .reverse()
        .find((m) => m.remetente === 'agente_sugestao' && m.status === 'pendente')

      if (pending) {
        pendingSugestaoMsg = pending
        sugestaoTextoEditavel = pending.texto
      } else {
        pendingSugestaoMsg = null
        sugestaoTextoEditavel = ''
      }
    } catch (err) {
      console.error('Erro ao carregar mensagens da conversa:', err)
    } finally {
      isLoadingMensagens = false
    }
  }

  onMount(() => {
    loadConversas()
  })

  async function handleEnviarManual() {
    if (!selectedConversaId || !inputTextoManual.trim() || isSending) return
    const texto = inputTextoManual.trim()
    inputTextoManual = ''
    isSending = true
    try {
      await window.razai.agentes.enviarMensagem(selectedConversaId, texto)
      await selectConversa(selectedConversaId)
      await loadConversas()
    } catch (err: any) {
      alert(`Erro ao enviar mensagem: ${err.message}`)
    } finally {
      isSending = false
    }
  }

  async function handleAprovarSugestao() {
    if (!pendingSugestaoMsg || isSending) return
    isSending = true
    try {
      await window.razai.agentes.aprovarSugestao(pendingSugestaoMsg.id, sugestaoTextoEditavel)
      if (selectedConversaId) {
        await selectConversa(selectedConversaId)
      }
      await loadConversas()
    } catch (err: any) {
      alert(`Erro ao aprovar sugestão: ${err.message}`)
    } finally {
      isSending = false
    }
  }

  async function handleRejeitarSugestao() {
    if (!pendingSugestaoMsg || isSending) return
    isSending = true
    try {
      await window.razai.agentes.rejeitarSugestao(pendingSugestaoMsg.id)
      if (selectedConversaId) {
        await selectConversa(selectedConversaId)
      }
      await loadConversas()
    } catch (err: any) {
      alert(`Erro ao rejeitar sugestão: ${err.message}`)
    } finally {
      isSending = false
    }
  }

  async function handleRegerarSugestao() {
    if (!selectedConversa || isRegenerating) return

    const lastClientMsg = mensagens
      .slice()
      .reverse()
      .find((m) => m.remetente === 'cliente')

    if (!lastClientMsg) {
      alert('Nenhuma mensagem de cliente encontrada para gerar resposta.')
      return
    }

    isRegenerating = true
    try {
      const res = await window.razai.agentes.gerarRespostaIa(agente.id, lastClientMsg.texto, selectedConversa.id)
      sugestaoTextoEditavel = res.resposta
    } catch (err: any) {
      alert(`Erro ao regerar sugestão: ${err.message}`)
    } finally {
      isRegenerating = false
    }
  }

  function handleKeydownManual(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleEnviarManual()
    }
  }
</script>

<div class="copilot-container">
  <!-- Topbar do Atendimento -->
  <header class="copilot-topbar">
    <div class="topbar-left">
      <Button variant="secondary" onclick={onback}>← VOLTAR AOS AGENTES</Button>
      <div class="agent-info">
        <span class="prefix">CENTRAL DE ATENDIMENTO //</span>
        <span class="name">{agente.nome}</span>
        <Badge
          text={agente.modoOperacao === 'copiloto' ? 'MODO CO-PILOTO' : 'MODO AUTÔNOMO'}
          tone="info"
        />
      </div>
    </div>
    <div class="topbar-right">
      <Button variant="secondary" onclick={loadConversas} disabled={isLoadingConversas}>
        🔄 ATUALIZAR FILA
      </Button>
    </div>
  </header>

  <!-- Grade 3 Colunas -->
  <div class="copilot-grid">
    <!-- Coluna 1: Lista de Conversas -->
    <aside class="col-conversas">
      <div class="col-header">
        <span>CONVERSAS ({conversas.length})</span>
      </div>
      <div class="conversas-list">
        {#if isLoadingConversas}
          <div class="empty-pad">
            <EmptyState title="Carregando fila..." />
          </div>
        {:else if conversas.length === 0}
          <div class="empty-pad">
            <EmptyState
              title="Nenhuma conversa ativa"
              description="Quando clientes enviarem mensagens na Shopee, elas aparecerão aqui."
            />
          </div>
        {:else}
          {#each conversas as conv (conv.id)}
            <button
              class="conversa-item"
              class:selected={conv.id === selectedConversaId}
              onclick={() => selectConversa(conv.id)}
            >
              <div class="conv-head">
                <span class="conv-nome">{conv.clienteNome}</span>
                <span class="conv-time">
                  {new Date(conv.ultimaMensagemAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div class="conv-preview">
                {conv.ultimaMensagemTexto || 'Sem mensagens recentes'}
              </div>
              <div class="conv-status">
                {#if conv.ultimoErro}
                  <Badge text="FALHA DE ENVIO" tone="danger" />
                {:else if conv.status === 'aguardando_aprovacao'}
                  <Badge text="AGUARDANDO APROVAÇÃO" tone="warn" />
                {:else if conv.status === 'respondido'}
                  <Badge text="RESPONDIDO" tone="ok" />
                {:else}
                  <Badge text="ARQUIVADO" tone="neutral" />
                {/if}
              </div>
            </button>
          {/each}
        {/if}
      </div>
    </aside>

    <!-- Coluna 2: Chat / Histórico de Mensagens -->
    <section class="col-chat">
      {#if !selectedConversa}
        <div class="empty-pad">
          <EmptyState title="Selecione uma conversa" description="Clique em um cliente na coluna à esquerda para abrir o chat." />
        </div>
      {:else}
        <div class="chat-header">
          <div class="client-meta">
            <span class="client-name">{selectedConversa.clienteNome}</span>
            <span class="client-canal mono font-xs">Canal: Shopee Web</span>
          </div>
        </div>
        {#if selectedConversa.ultimoErro}
          <div class="connection-error" role="alert">
            <span>FALHA //</span>
            <span>{selectedConversa.ultimoErro}</span>
          </div>
        {/if}

        <div class="messages-area">
          {#if isLoadingMensagens}
            <div class="empty-pad">
              <EmptyState title="Carregando histórico..." />
            </div>
          {:else}
            {#each mensagens as msg (msg.id)}
              <div
                class="msg-bubble"
                class:client={msg.remetente === 'cliente'}
                class:operator={msg.remetente === 'operador'}
                class:ai-suggestion={msg.remetente === 'agente_sugestao'}
              >
                <div class="bubble-meta">
                  <span class="sender">
                    {#if msg.remetente === 'cliente'}
                      {selectedConversa.clienteNome}
                    {:else if msg.remetente === 'operador'}
                      OPERADOR HUMANO
                    {:else if msg.remetente === 'agente_sugestao'}
                      🤖 SUGESTÃO DA IA ({agente.nome})
                    {:else}
                      AGENTE (ENVIADO)
                    {/if}
                  </span>
                  <span class="time mono font-xs">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div class="bubble-text">{msg.texto}</div>
                {#if msg.remetente === 'agente_sugestao'}
                  <div class="suggestion-status">
                    <Badge
                      text={msg.status === 'pendente' ? 'STATUS: AGUARDANDO SUA REVISÃO' : `STATUS: ${msg.status.toUpperCase()}`}
                      tone={msg.status === 'pendente' ? 'warn' : msg.status === 'falha' ? 'danger' : 'ok'}
                    />
                  </div>
                  {#if msg.fontes?.length}
                    <div class="suggestion-sources">
                      <span>FONTES //</span>
                      <span>{msg.fontes.join(' · ')}</span>
                    </div>
                  {/if}
                {/if}
                {#if msg.status === 'falha'}
                  <div class="suggestion-status">
                    <Badge text="ENVIO NÃO CONFIRMADO" tone="danger" />
                  </div>
                {/if}
              </div>
            {/each}
          {/if}
        </div>

        <div class="chat-composer">
          <input
            type="text"
            class="composer-input"
            bind:value={inputTextoManual}
            placeholder="Digite uma resposta manual (Enter para enviar)..."
            onkeydown={handleKeydownManual}
            disabled={isSending}
          />
          <Button variant="primary" onclick={handleEnviarManual} disabled={isSending || !inputTextoManual.trim()}>
            ENVIAR
          </Button>
        </div>
      {/if}
    </section>

    <!-- Coluna 3: Painel Co-piloto da IA -->
    <aside class="col-copilot">
      <div class="col-header">
        <span>PAINEL CO-PILOTO DA IA</span>
      </div>

      <div class="copilot-body">
        {#if !selectedConversa}
          <p class="copilot-hint">Selecione uma conversa para ver as sugestões de resposta da IA.</p>
        {:else if pendingSugestaoMsg}
          <div class="card-sugestao">
            <div class="sugestao-head">
              <span class="sug-tag">RESPOSTA SUGERIDA (EDITÁVEL)</span>
              {#if pendingSugestaoMsg.confianca}
                <Badge text={`CONFIANÇA: ${Math.round(pendingSugestaoMsg.confianca * 100)}%`} tone="ok" />
              {/if}
            </div>

            <textarea
              class="sugestao-textarea"
              bind:value={sugestaoTextoEditavel}
              rows="7"
              placeholder="Resposta sugerida pela IA..."
            ></textarea>

            <div class="sugestao-actions">
              <Button variant="primary" onclick={handleAprovarSugestao} disabled={isSending}>
                ⚡ APROVAR E ENVIAR
              </Button>
              <div class="sec-actions">
                <Button variant="secondary" onclick={handleRegerarSugestao} disabled={isRegenerating}>
                  {isRegenerating ? 'REGERANDO...' : '🔄 REGERAR'}
                </Button>
                <Button variant="danger" onclick={handleRejeitarSugestao} disabled={isSending}>
                  ✕ REJEITAR
                </Button>
              </div>
            </div>
          </div>
        {:else}
          <div class="card-sem-sugestao">
            <span class="info-title">NENHUMA SUGESTÃO PENDENTE</span>
            <p class="info-desc">
              Todas as mensagens recentes desta conversa já foram respondidas ou aprovadas.
            </p>
            <Button variant="secondary" onclick={handleRegerarSugestao} disabled={isRegenerating}>
              {isRegenerating ? 'GERANDO...' : '💡 GERAR NOVA SUGESTÃO'}
            </Button>
          </div>
        {/if}

        <div class="knowledge-context-box">
          <div class="ctx-title">FONTES E REGRAS ATIVAS DO AGENTE</div>
          <div class="ctx-desc">
            O agente utiliza {agente.conhecimentosCount || 0} regras/FAQs ativas para formular respostas automáticas.
          </div>
        </div>
      </div>
    </aside>
  </div>
</div>

<style>
  .copilot-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    box-sizing: border-box;
  }

  .copilot-topbar {
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--space-3);
    box-shadow: inset 0 -1px 0 0 var(--color-border);
    background: var(--color-bg-elevated);
    box-sizing: border-box;
  }

  .topbar-left {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .agent-info {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-xs);
    line-height: 100%;
  }

  .agent-info .prefix {
    color: var(--color-fg-muted);
    letter-spacing: var(--tracking-label);
  }

  .agent-info .name {
    font-weight: 600;
    color: var(--color-fg);
  }

  .copilot-grid {
    flex: 1;
    display: grid;
    grid-template-columns: 280px 1fr 340px;
    min-height: 0;
    box-sizing: border-box;
  }

  .col-conversas {
    box-shadow: inset -1px 0 0 0 var(--color-border);
    display: flex;
    flex-direction: column;
    background: var(--color-bg);
    box-sizing: border-box;
  }

  .col-chat {
    box-shadow: inset -1px 0 0 0 var(--color-border);
    display: flex;
    flex-direction: column;
    background: var(--color-bg);
    min-width: 0;
    box-sizing: border-box;
  }

  .col-copilot {
    display: flex;
    flex-direction: column;
    background: var(--color-bg-elevated);
    box-sizing: border-box;
  }

  .col-header {
    height: 40px;
    display: flex;
    align-items: center;
    padding: 0 var(--space-3);
    box-shadow: inset 0 -1px 0 0 var(--color-border);
    background: var(--color-bg-elevated);
    font-size: var(--text-xs);
    font-weight: 600;
    letter-spacing: var(--tracking-label);
    color: var(--color-fg-muted);
    line-height: 100%;
    box-sizing: border-box;
  }

  .conversas-list {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
  }

  .conversa-item {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    padding: var(--space-2) var(--space-3);
    background: none;
    border: none;
    text-align: left;
    cursor: pointer;
    box-shadow: inset 0 -1px 0 0 var(--color-border);
    font-family: inherit;
    box-sizing: border-box;
  }

  .conversa-item:hover {
    background: var(--color-bg-elevated);
  }

  .conversa-item.selected {
    background: var(--color-bg-elevated);
    box-shadow: inset 3px 0 0 0 var(--color-fg), inset 0 -1px 0 0 var(--color-border);
  }

  .conv-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .conv-nome {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-fg);
    line-height: 100%;
  }

  .conv-time {
    font-size: 11px;
    color: var(--color-fg-muted);
    font-family: var(--font-mono);
  }

  .conv-preview {
    font-size: 11px;
    color: var(--color-fg-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .conv-status {
    display: flex;
    margin-top: 2px;
  }

  .chat-header {
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--space-3);
    box-shadow: inset 0 -1px 0 0 var(--color-border);
    background: var(--color-bg-elevated);
    box-sizing: border-box;
  }

  .connection-error {
    min-height: 32px;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: 0 var(--space-3);
    border-bottom: var(--border-width) solid var(--color-danger);
    color: var(--color-danger);
    background: var(--color-bg);
    font-size: var(--text-xs);
    line-height: 100%;
    box-sizing: border-box;
  }

  .client-meta {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .client-name {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-fg);
  }

  .messages-area {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-3);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    box-sizing: border-box;
  }

  .msg-bubble {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    padding: var(--space-2) var(--space-3);
    border: var(--border-width) solid var(--color-border);
    background: var(--color-bg-elevated);
    max-width: 85%;
    box-sizing: border-box;
  }

  .msg-bubble.client {
    align-self: flex-start;
    border-color: var(--color-border-strong);
  }

  .msg-bubble.operator {
    align-self: flex-end;
    background: var(--color-bg);
    border-color: var(--color-fg-muted);
  }

  .msg-bubble.ai-suggestion {
    align-self: flex-start;
    border-color: var(--color-ok);
    background: var(--color-bg-elevated);
  }

  .bubble-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
  }

  .sender {
    font-size: 11px;
    font-weight: 600;
    color: var(--color-fg-muted);
    letter-spacing: var(--tracking-label);
  }

  .bubble-text {
    font-size: var(--text-xs);
    color: var(--color-fg);
    line-height: 140%;
    white-space: pre-wrap;
  }

  .suggestion-status {
    margin-top: var(--space-1);
  }

  .suggestion-sources {
    display: flex;
    gap: var(--space-2);
    color: var(--color-fg-muted);
    font-size: 11px;
    line-height: 100%;
  }

  .chat-composer {
    height: 48px;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: 0 var(--space-3);
    box-shadow: inset 0 1px 0 0 var(--color-border);
    background: var(--color-bg-elevated);
    box-sizing: border-box;
  }

  .composer-input {
    flex: 1;
    height: 32px;
    background: var(--color-bg);
    border: var(--border-width) solid var(--color-border);
    color: var(--color-fg);
    font-family: inherit;
    font-size: var(--text-xs);
    padding: 0 var(--space-2);
    box-sizing: border-box;
    line-height: 100%;
  }

  .composer-input:focus {
    outline: none;
    border-color: var(--color-fg);
  }

  .copilot-body {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-3);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    box-sizing: border-box;
  }

  .card-sugestao,
  .card-sem-sugestao {
    border: var(--border-width) solid var(--color-border);
    background: var(--color-bg);
    padding: var(--space-3);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    box-sizing: border-box;
  }

  .sugestao-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .sug-tag {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: var(--tracking-label);
    color: var(--color-fg);
    line-height: 100%;
  }

  .sugestao-textarea {
    width: 100%;
    background: var(--color-bg-elevated);
    border: var(--border-width) solid var(--color-border);
    color: var(--color-fg);
    font-family: inherit;
    font-size: var(--text-xs);
    padding: var(--space-2);
    resize: vertical;
    box-sizing: border-box;
    line-height: 140%;
  }

  .sugestao-textarea:focus {
    outline: none;
    border-color: var(--color-fg);
  }

  .sugestao-actions {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .sec-actions {
    display: flex;
    gap: var(--space-2);
  }

  .info-title {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-fg);
    letter-spacing: var(--tracking-label);
  }

  .info-desc,
  .copilot-hint {
    font-size: var(--text-xs);
    color: var(--color-fg-muted);
    line-height: 140%;
    margin: 0;
  }

  .knowledge-context-box {
    border: var(--border-width) solid var(--color-border);
    background: var(--color-bg);
    padding: var(--space-3);
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    box-sizing: border-box;
  }

  .ctx-title {
    font-size: 11px;
    font-weight: 600;
    color: var(--color-fg-muted);
    letter-spacing: var(--tracking-label);
  }

  .ctx-desc {
    font-size: var(--text-xs);
    color: var(--color-fg-muted);
    line-height: 140%;
  }

  .empty-pad {
    padding: var(--space-6) 0;
  }

  .mono {
    font-family: var(--font-mono);
  }

  .font-xs {
    font-size: 11px;
    color: var(--color-fg-muted);
  }
</style>
