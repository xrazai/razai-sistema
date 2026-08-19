<script lang="ts">
  import { untrack } from 'svelte'
  import Button from '../../../design-system/controls/Button.svelte'
  import Badge from '../../../design-system/data-display/Badge.svelte'
  import Input from '../../../design-system/controls/Input.svelte'
  import type { AgenteRecord, AgenteGerarRespostaResult } from '../../../../shared/types'

  type Props = {
    agente: AgenteRecord
    onclose: () => void
  }

  type TestMessage = {
    id: string
    sender: 'user' | 'agent'
    text: string
    fontes?: string[]
    confianca?: number
    timestamp: string
  }

  let { agente, onclose }: Props = $props()

  let inputTexto = $state('')
  let isGenerating = $state(false)
  let messages = $state<TestMessage[]>(
    untrack(() => [
      {
        id: 'm1',
        sender: 'agent',
        text: `Olá! Eu sou o assistente "${agente.nome}". Minha base de conhecimento conta com ${agente.conhecimentosCount || 0} regras e FAQs cadastradas. Faça uma pergunta para testar minhas respostas!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ])
  )

  async function handleSend() {
    if (!inputTexto.trim() || isGenerating) return

    const userText = inputTexto.trim()
    inputTexto = ''

    const userMsg: TestMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    messages = [...messages, userMsg]
    isGenerating = true

    try {
      const res: AgenteGerarRespostaResult = await window.razai.agentes.gerarRespostaIa(
        agente.id,
        userText
      )

      const agentMsg: TestMessage = {
        id: `a-${Date.now()}`,
        sender: 'agent',
        text: res.resposta,
        fontes: res.fontes,
        confianca: res.confianca,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }

      messages = [...messages, agentMsg]
    } catch (err: any) {
      const errorMsg: TestMessage = {
        id: `err-${Date.now()}`,
        sender: 'agent',
        text: `Erro ao gerar resposta: ${err.message || 'Falha de comunicação'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      messages = [...messages, errorMsg]
    } finally {
      isGenerating = false
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }
</script>

<div class="modal-backdrop" role="dialog" aria-modal="true">
  <div class="modal-box">
    <header class="modal-header">
      <div class="header-title">
        <span class="prefix">SIMULADOR //</span>
        <h2>TESTE DE ATENDIMENTO — {agente.nome}</h2>
      </div>
      <button class="close-btn" onclick={onclose} aria-label="Fechar">✕</button>
    </header>

    <div class="chat-area">
      {#each messages as msg (msg.id)}
        <div class="msg-row" class:user={msg.sender === 'user'}>
          <div class="msg-bubble" class:user={msg.sender === 'user'}>
            <div class="msg-meta">
              <span class="sender-tag">{msg.sender === 'user' ? 'CLIENTE (TESTE)' : agente.nome}</span>
              <span class="time-tag">{msg.timestamp}</span>
            </div>
            <div class="msg-text">{msg.text}</div>

            {#if msg.fontes && msg.fontes.length > 0}
              <div class="sources-wrap">
                <span class="sources-label">FONTES USADAS:</span>
                <div class="sources-list">
                  {#each msg.fontes as fonte}
                    <Badge text={fonte} tone="info" />
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        </div>
      {/each}

      {#if isGenerating}
        <div class="msg-row">
          <div class="msg-bubble">
            <div class="typing-indicator">Consultando base de conhecimento e gerando resposta...</div>
          </div>
        </div>
      {/if}
    </div>

    <footer class="chat-footer">
      <div class="input-wrap">
        <input
          type="text"
          class="chat-input"
          bind:value={inputTexto}
          placeholder="Digite uma dúvida para o agente (ex: Qual o prazo de postagem?)..."
          onkeydown={handleKeydown}
          disabled={isGenerating}
        />
      </div>
      <Button variant="primary" onclick={handleSend} disabled={isGenerating || !inputTexto.trim()}>
        ENVIAR
      </Button>
    </footer>
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-box {
    width: 680px;
    height: 520px;
    max-width: 90vw;
    background: var(--color-bg);
    border: var(--border-width) solid var(--color-border-strong);
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
  }

  .modal-header {
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--space-3);
    box-shadow: inset 0 -1px 0 0 var(--color-border);
    background: var(--color-bg-elevated);
    box-sizing: border-box;
  }

  .header-title {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .header-title .prefix {
    font-size: var(--text-xs);
    color: var(--color-fg-muted);
    letter-spacing: var(--tracking-label);
  }

  .header-title h2 {
    font-size: var(--text-xs);
    font-weight: 600;
    letter-spacing: var(--tracking-label);
    color: var(--color-fg);
    margin: 0;
    line-height: 100%;
  }

  .close-btn {
    background: none;
    border: none;
    color: var(--color-fg-muted);
    font-family: inherit;
    font-size: var(--text-sm);
    cursor: pointer;
    padding: 0;
    line-height: 100%;
  }

  .close-btn:hover {
    color: var(--color-fg);
  }

  .chat-area {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-3);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    background: var(--color-bg);
    box-sizing: border-box;
  }

  .msg-row {
    display: flex;
    justify-content: flex-start;
  }

  .msg-row.user {
    justify-content: flex-end;
  }

  .msg-bubble {
    max-width: 80%;
    padding: var(--space-2) var(--space-3);
    border: var(--border-width) solid var(--color-border);
    background: var(--color-bg-elevated);
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .msg-bubble.user {
    border-color: var(--color-fg-muted);
    background: var(--color-bg);
  }

  .msg-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    font-size: 11px;
    line-height: 100%;
  }

  .sender-tag {
    font-weight: 600;
    color: var(--color-fg-muted);
    letter-spacing: var(--tracking-label);
    text-transform: uppercase;
  }

  .time-tag {
    color: var(--color-fg-muted);
    font-family: var(--font-mono);
  }

  .msg-text {
    font-size: var(--text-xs);
    color: var(--color-fg);
    line-height: 140%;
    white-space: pre-wrap;
  }

  .sources-wrap {
    margin-top: var(--space-2);
    padding-top: var(--space-1);
    box-shadow: inset 0 1px 0 0 var(--color-border);
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .sources-label {
    font-size: 10px;
    color: var(--color-fg-muted);
    letter-spacing: var(--tracking-label);
    line-height: 100%;
  }

  .sources-list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
  }

  .typing-indicator {
    font-size: var(--text-xs);
    color: var(--color-fg-muted);
    font-style: italic;
    line-height: 100%;
  }

  .chat-footer {
    height: 48px;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: 0 var(--space-3);
    box-shadow: inset 0 1px 0 0 var(--color-border);
    background: var(--color-bg-elevated);
    box-sizing: border-box;
  }

  .input-wrap {
    flex: 1;
  }

  .chat-input {
    width: 100%;
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

  .chat-input:focus {
    outline: none;
    border-color: var(--color-fg);
  }
</style>
