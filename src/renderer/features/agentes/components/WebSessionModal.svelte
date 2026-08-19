<script lang="ts">
  import { onMount } from 'svelte'
  import Button from '../../../design-system/controls/Button.svelte'
  import Badge from '../../../design-system/data-display/Badge.svelte'
  import Input from '../../../design-system/controls/Input.svelte'
  import type { AgenteRecord, ShopeeChatMapSnapshot, ShopeeSessionStatus } from '../../../../shared/types'

  type Props = {
    agente: AgenteRecord
    onclose: () => void
  }

  let { agente, onclose }: Props = $props()

  let status = $state<ShopeeSessionStatus | null>(null)
  let isChecking = $state(true)
  let testClienteNome = $state('Mariana Costa')
  let testPergunta = $state('Qual o prazo de postagem do pedido?')
  let isSimulating = $state(false)
  let simulationSuccess = $state<string | null>(null)
  let mapa = $state<ShopeeChatMapSnapshot | null>(null)
  let isMapping = $state(false)

  async function checkStatus() {
    isChecking = true
    try {
      status = await window.razai.agentes.shopee.verificarStatus()
    } catch (err) {
      console.error('Erro ao verificar status da Shopee:', err)
    } finally {
      isChecking = false
    }
  }

  async function loadMapa() {
    try {
      mapa = await window.razai.agentes.shopee.obterMapa()
    } catch (err) {
      console.error('Erro ao obter mapa do WebChat:', err)
    }
  }

  onMount(() => {
    checkStatus()
    loadMapa()
    const timer = setInterval(loadMapa, 8000)
    return () => clearInterval(timer)
  })

  async function handleOpenLogin() {
    await window.razai.agentes.shopee.abrirLogin()
  }

  async function handleLimparSessao() {
    if (confirm('Deseja realmente desconectar e limpar os cookies salvos da Shopee?')) {
      await window.razai.agentes.shopee.limparSessao()
      await checkStatus()
    }
  }

  async function handleIniciarMapeamento() {
    isMapping = true
    try {
      mapa = await window.razai.agentes.shopee.iniciarMapeamento()
    } catch (err: any) {
      alert(`Erro ao mapear WebChat: ${err.message || 'Falha'}`)
    } finally {
      isMapping = false
    }
  }

  async function handleAtualizarMapa() {
    isMapping = true
    try {
      mapa = await window.razai.agentes.shopee.atualizarMapa()
    } catch (err: any) {
      alert(`Erro ao atualizar mapa: ${err.message || 'Falha'}`)
    } finally {
      isMapping = false
    }
  }

  async function handleSimularMensagem() {
    if (!testPergunta.trim() || isSimulating) return
    isSimulating = true
    simulationSuccess = null
    try {
      const res = await window.razai.agentes.shopee.simularMensagem(
        agente.id,
        testClienteNome.trim() || 'Cliente Shopee',
        testPergunta.trim()
      )
      simulationSuccess = `Mensagem recebida com sucesso! Sugestão gerada pela IA e enviada para a fila de atendimento.`
    } catch (err: any) {
      alert(`Erro na simulação: ${err.message || 'Falha'}`)
    } finally {
      isSimulating = false
    }
  }
</script>

<div class="modal-backdrop" role="dialog" aria-modal="true">
  <div class="modal-box">
    <header class="modal-header">
      <div class="header-title">
        <span class="prefix">SESSÃO WEB //</span>
        <h2>CONEXÃO SHOPEE SELLER CENTRE — {agente.nome}</h2>
      </div>
      <button class="close-btn" onclick={onclose} aria-label="Fechar">✕</button>
    </header>

    <div class="modal-body">
      <!-- Painel de Status da Sessão -->
      <div class="status-card">
        <div class="card-head">
          <span class="label">STATUS DA SESSÃO ELECTRON</span>
          {#if isChecking}
            <Badge text="VERIFICANDO..." tone="neutral" />
          {:else if status?.conectado}
            <Badge text="🟢 SESSÃO ATIVA" tone="ok" />
          {:else}
            <Badge text="🟡 LOGIN NECESSÁRIO" tone="warn" />
          {/if}
        </div>

        <div class="status-details">
          <div class="detail-row">
            <span class="key">Partição Local:</span>
            <span class="val mono">persist:shopee-seller</span>
          </div>
          <div class="detail-row">
            <span class="key">Cookies Salvos:</span>
            <span class="val mono">{status?.cookiesCount ?? 0} cookies</span>
          </div>
          {#if status?.shopNome}
            <div class="detail-row">
              <span class="key">Identificação:</span>
              <span class="val">{status.shopNome}</span>
            </div>
          {/if}
        </div>

        <div class="btn-group">
          <Button variant="primary" onclick={handleOpenLogin}>
            🌐 ABRIR JANELA DE LOGIN DA SHOPEE
          </Button>
          <Button variant="secondary" onclick={checkStatus} disabled={isChecking}>
            🔄 ATUALIZAR STATUS
          </Button>
          {#if status?.conectado}
            <Button variant="danger" onclick={handleLimparSessao}>
              🧹 DESCONECTAR / LIMPAR COOKIES
            </Button>
          {/if}
        </div>
      </div>

      <div class="sim-card">
        <div class="sim-title">MAPA DO WEBCHAT (HOJE + ONTEM)</div>
        <p class="sim-desc">
          Só entram conversas com última mensagem hoje ou ontem (horário de Brasília). Conversas mais
          antigas são ignoradas e o agente não responde a elas.
        </p>

        <div class="status-details">
          <div class="detail-row">
            <span class="key">URL:</span>
            <span class="val mono">{mapa?.urlAtual || 'https://seller.shopee.com.br/new-webchat/conversations'}</span>
          </div>
          <div class="detail-row">
            <span class="key">Janela:</span>
            <span class="val mono">{mapa ? `${mapa.janelaOntem} → ${mapa.janelaHoje}` : '—'}</span>
          </div>
          <div class="detail-row">
            <span class="key">Recentes / ignoradas:</span>
            <span class="val mono">{mapa?.conversasRecentes.length ?? 0} / {mapa?.conversasIgnoradas ?? 0}</span>
          </div>
        </div>

        <div class="btn-group">
          <Button variant="primary" onclick={handleIniciarMapeamento} disabled={isMapping}>
            {isMapping ? 'MAPEANDO...' : 'MAPEAR WEBCHAT ABERTO'}
          </Button>
          <Button variant="secondary" onclick={handleAtualizarMapa} disabled={isMapping}>
            ATUALIZAR MAPA
          </Button>
        </div>

        {#if mapa && mapa.conversasRecentes.length > 0}
          <div class="map-list">
            {#each mapa.conversasRecentes as conv (conv.id)}
              <div class="map-row">
                <div class="map-main">
                  <span class="map-name">{conv.clienteNome}</span>
                  <span class="map-preview">{conv.ultimaMensagem || '—'}</span>
                </div>
                <span class="map-time mono">{conv.ultimaMensagemLabel}</span>
              </div>
            {/each}
          </div>
        {:else}
          <p class="sim-desc">Nenhuma conversa de hoje ou ontem mapeada ainda. Abra o WebChat e clique em mapear.</p>
        {/if}

        {#if mapa && mapa.endpoints.length > 0}
          <div class="endpoint-list">
            {#each mapa.endpoints.slice(0, 8) as ep (`${ep.method}-${ep.url}`)}
              <div class="endpoint-row mono">{ep.method} · {ep.kind} · {ep.url}</div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Teste de Mensagem / Simulação do Canal -->
      <div class="sim-card">
        <div class="sim-title">TESTAR RECEBIMENTO DE MENSAGEM DO CHAT</div>
        <p class="sim-desc">
          Simule o recebimento de uma mensagem em tempo real da Shopee para testar a captura pelo
          sistema e a sugestão imediata da IA.
        </p>

        {#if simulationSuccess}
          <div class="success-banner">
            <span>{simulationSuccess}</span>
          </div>
        {/if}

        <div class="form-grid">
          <div class="field-row">
            <label class="field-label" for="sim-nome">Nome do Cliente</label>
            <Input id="sim-nome" bind:value={testClienteNome} placeholder="Ex: Mariana Costa" />
          </div>
          <div class="field-row">
            <label class="field-label" for="sim-msg">Mensagem / Dúvida do Cliente</label>
            <Input
              id="sim-msg"
              bind:value={testPergunta}
              placeholder="Ex: Vocês enviam no mesmo dia?"
            />
          </div>
        </div>

        <div class="sim-action">
          <Button variant="secondary" onclick={handleSimularMensagem} disabled={isSimulating}>
            {isSimulating ? 'PROCESSANDO...' : '⚡ SIMULAR MENSAGEM RECEBIDA'}
          </Button>
        </div>
      </div>
    </div>

    <footer class="modal-footer">
      <Button variant="secondary" onclick={onclose}>FECHAR</Button>
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
    width: 720px;
    max-width: 90vw;
    max-height: 90vh;
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

  .modal-body {
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    box-sizing: border-box;
    overflow-y: auto;
  }

  .status-card,
  .sim-card {
    border: var(--border-width) solid var(--color-border);
    background: var(--color-bg-elevated);
    padding: var(--space-3);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    box-sizing: border-box;
  }

  .card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .label,
  .sim-title {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-fg);
    letter-spacing: var(--tracking-label);
    line-height: 100%;
  }

  .sim-desc {
    font-size: var(--text-xs);
    color: var(--color-fg-muted);
    margin: 0;
    line-height: 140%;
  }

  .status-details {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    font-size: var(--text-xs);
    line-height: 100%;
  }

  .detail-row {
    display: flex;
    gap: var(--space-2);
  }

  .key {
    color: var(--color-fg-muted);
    width: 120px;
  }

  .val {
    color: var(--color-fg);
  }

  .mono {
    font-family: var(--font-mono);
  }

  .btn-group {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-top: var(--space-1);
  }

  .form-grid {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .field-row {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .field-label {
    font-size: 11px;
    color: var(--color-fg-muted);
    letter-spacing: var(--tracking-label);
    text-transform: uppercase;
    line-height: 100%;
  }

  .sim-action {
    display: flex;
    justify-content: flex-end;
  }

  .map-list,
  .endpoint-list {
    display: flex;
    flex-direction: column;
    box-shadow: inset 0 0 0 1px var(--color-border);
    box-sizing: border-box;
  }

  .map-row {
    min-height: 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    padding: 0 var(--space-2);
    box-shadow: inset 0 -1px 0 0 var(--color-border);
    box-sizing: border-box;
  }

  .map-row:last-child {
    box-shadow: none;
  }

  .map-main {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .map-name {
    font-size: var(--text-xs);
    color: var(--color-fg);
    line-height: 100%;
  }

  .map-preview,
  .map-time,
  .endpoint-row {
    font-size: 11px;
    color: var(--color-fg-muted);
    line-height: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .endpoint-row {
    height: 24px;
    display: flex;
    align-items: center;
    padding: 0 var(--space-2);
    box-shadow: inset 0 -1px 0 0 var(--color-border);
    box-sizing: border-box;
  }

  .success-banner {
    padding: var(--space-2) var(--space-3);
    border: var(--border-width) solid var(--color-ok);
    background: var(--color-bg);
    color: var(--color-ok);
    font-size: var(--text-xs);
    line-height: 140%;
  }

  .modal-footer {
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 0 var(--space-3);
    box-shadow: inset 0 1px 0 0 var(--color-border);
    background: var(--color-bg-elevated);
    box-sizing: border-box;
  }
</style>
