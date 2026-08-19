<script lang="ts">
  import { untrack } from 'svelte'
  import Button from '../../../design-system/controls/Button.svelte'
  import Input from '../../../design-system/controls/Input.svelte'
  import Select from '../../../design-system/controls/Select.svelte'
  import type { AgenteRecord, CreateAgenteInput, UpdateAgenteInput } from '../../../../shared/types'

  type Props = {
    agente?: AgenteRecord | null
    onclose: () => void
    onsave: (saved: AgenteRecord) => void
  }

  let { agente = null, onclose, onsave }: Props = $props()

  let isEditing = $derived(Boolean(agente?.id))
  let activeTab = $state<'identidade' | 'canal' | 'prompt'>('identidade')

  let nome = $state(untrack(() => agente?.nome || ''))
  let descricao = $state(untrack(() => agente?.descricao || ''))
  let canal = $state(untrack(() => agente?.canal || 'shopee'))
  let tipoConexao = $state(untrack(() => agente?.tipoConexao || 'web_session'))
  let modoOperacao = $state(untrack(() => agente?.modoOperacao || 'copiloto'))
  let promptSistema = $state(
    untrack(
      () =>
        agente?.promptSistema ||
        `Você é a assistente de vendas da Loja Razai Tecidos.
Seu objetivo é atender os clientes com cordialidade, precisão e clareza.
Use linguagem polida e acessível.
Responda dúvidas sobre características dos tecidos, indicações de uso, cuidados e políticas de envio baseando-se estritamente na base de conhecimento da loja.`
    )
  )
  let ativo = $state(untrack(() => (agente ? agente.ativo : true)))

  let isSaving = $state(false)
  let errorMsg = $state<string | null>(null)

  const canalOptions = [
    { value: 'shopee', label: 'Shopee' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'manual', label: 'Atendimento Manual / Balcão' }
  ]

  const modoOptions = [
    { value: 'copiloto', label: 'Co-piloto (Sugere resposta com 1 clique para aprovar)' },
    { value: 'autonomo', label: '100% Autônomo (Responde automaticamente)' },
    { value: 'pausado', label: 'Pausado (Não monitora mensagens)' }
  ]

  async function handleSubmit() {
    errorMsg = null
    if (!nome.trim()) {
      errorMsg = 'O nome do agente é obrigatório.'
      return
    }

    isSaving = true
    try {
      if (isEditing && agente) {
        const updateInput: UpdateAgenteInput = {
          nome: nome.trim(),
          descricao: descricao.trim() || null,
          canal: canal as any,
          tipoConexao: tipoConexao as any,
          modoOperacao: modoOperacao as any,
          promptSistema,
          ativo
        }
        const updated = await window.razai.agentes.update(agente.id, updateInput)
        onsave(updated)
      } else {
        const createInput: CreateAgenteInput = {
          nome: nome.trim(),
          descricao: descricao.trim() || null,
          canal: canal as any,
          tipoConexao: tipoConexao as any,
          modoOperacao: modoOperacao as any,
          promptSistema,
          ativo
        }
        const created = await window.razai.agentes.create(createInput)
        onsave(created)
      }
    } catch (err: any) {
      errorMsg = err.message || 'Erro ao salvar agente.'
    } finally {
      isSaving = false
    }
  }
</script>

<div class="modal-backdrop" role="dialog" aria-modal="true">
  <div class="modal-box">
    <header class="modal-header">
      <div class="header-title">
        <span class="prefix">AGENTES //</span>
        <h2>{isEditing ? `EDITAR // ${agente?.nome}` : 'NOVO AGENTE DE ATENDIMENTO'}</h2>
      </div>
      <button class="close-btn" onclick={onclose} aria-label="Fechar">✕</button>
    </header>

    <div class="tabs-nav">
      <button
        class="tab-btn"
        class:active={activeTab === 'identidade'}
        onclick={() => (activeTab = 'identidade')}
      >
        01. IDENTIDADE & OPERAÇÃO
      </button>
      <button
        class="tab-btn"
        class:active={activeTab === 'canal'}
        onclick={() => (activeTab = 'canal')}
      >
        02. CANAL & CONEXÃO
      </button>
      <button
        class="tab-btn"
        class:active={activeTab === 'prompt'}
        onclick={() => (activeTab = 'prompt')}
      >
        03. PROMPT & TOM DE VOZ
      </button>
    </div>

    <div class="modal-body">
      {#if errorMsg}
        <div class="error-banner">
          <span>{errorMsg}</span>
        </div>
      {/if}

      {#if activeTab === 'identidade'}
        <div class="form-grid">
          <div class="field-row">
            <label class="field-label" for="ag-nome">Nome do Agente *</label>
            <Input id="ag-nome" bind:value={nome} placeholder="Ex: Vendedora Shopee" />
          </div>

          <div class="field-row">
            <label class="field-label" for="ag-desc">Descrição / Papel</label>
            <Input
              id="ag-desc"
              bind:value={descricao}
              placeholder="Ex: Atendente especialista em tecidos e corte"
            />
          </div>

          <div class="field-row">
            <label class="field-label" for="ag-modo">Modo de Operação</label>
            <Select id="ag-modo" bind:value={modoOperacao} options={modoOptions} />
          </div>

          <div class="field-row checkbox-row">
            <label class="checkbox-label">
              <input type="checkbox" bind:checked={ativo} />
              <span>Agente Ativo (Habilitado no sistema)</span>
            </label>
          </div>
        </div>
      {:else if activeTab === 'canal'}
        <div class="form-grid">
          <div class="field-row">
            <label class="field-label" for="ag-canal">Canal da Plataforma</label>
            <Select id="ag-canal" bind:value={canal} options={canalOptions} />
          </div>

          <div class="field-row">
            <span class="field-label">Método de Conexão</span>
            <div class="radio-group">
              <label class="radio-label">
                <input
                  type="radio"
                  name="tipoConexao"
                  value="web_session"
                  bind:group={tipoConexao}
                />
                <span>Navegador Web / Sessão Electron (Sem necessidade de API oficial)</span>
              </label>
              <label class="radio-label">
                <input
                  type="radio"
                  name="tipoConexao"
                  value="rest_api"
                  bind:group={tipoConexao}
                />
                <span>API Oficial REST (Requer credenciais de Desenvolvedor)</span>
              </label>
            </div>
          </div>

          {#if tipoConexao === 'web_session'}
            <div class="info-card">
              <div class="info-title">SESSÃO DE NAVEGADOR ELECTRON</div>
              <p class="info-desc">
                O Electron gerencia os cookies e o login do Seller Centre de forma isolada e
                persistente no computador local.
              </p>
            </div>
          {:else}
            <div class="info-card">
              <div class="info-title">INTEGRAÇÃO REST API OFICIAL</div>
              <p class="info-desc">
                Conexão via chaves Partner ID e Secret Key da Shopee Open Platform.
              </p>
            </div>
          {/if}
        </div>
      {:else if activeTab === 'prompt'}
        <div class="form-grid">
          <div class="field-row">
            <label class="field-label" for="ag-prompt">Prompt de Sistema (Personalidade & Regras Mestres)</label>
            <textarea
              id="ag-prompt"
              class="prompt-textarea"
              bind:value={promptSistema}
              rows="8"
              placeholder="Instruções de tom de voz, regras e limites do agente..."
            ></textarea>
          </div>
        </div>
      {/if}
    </div>

    <footer class="modal-footer">
      <Button variant="secondary" onclick={onclose} disabled={isSaving}>CANCELAR</Button>
      <Button variant="primary" onclick={handleSubmit} disabled={isSaving}>
        {isSaving ? 'SALVANDO...' : isEditing ? 'SALVAR ALTERAÇÕES' : 'CRIAR AGENTE'}
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
    width: 640px;
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

  .tabs-nav {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    height: 40px;
    box-shadow: inset 0 -1px 0 0 var(--color-border);
    box-sizing: border-box;
  }

  .tab-btn {
    height: 40px;
    background: var(--color-bg);
    border: none;
    color: var(--color-fg-muted);
    font-family: inherit;
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-label);
    cursor: pointer;
    box-shadow: inset -1px 0 0 0 var(--color-border);
    box-sizing: border-box;
    line-height: 100%;
  }

  .tab-btn:last-child {
    box-shadow: none;
  }

  .tab-btn.active {
    background: var(--color-bg-elevated);
    color: var(--color-fg);
    font-weight: 600;
    box-shadow: inset 0 -2px 0 0 var(--color-fg), inset -1px 0 0 0 var(--color-border);
  }

  .modal-body {
    padding: var(--space-4);
    min-height: 280px;
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    box-sizing: border-box;
  }

  .form-grid {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .field-row {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .field-label {
    font-size: var(--text-xs);
    color: var(--color-fg-muted);
    letter-spacing: var(--tracking-label);
    text-transform: uppercase;
    line-height: 100%;
  }

  .radio-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-2) 0;
  }

  .radio-label,
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-xs);
    color: var(--color-fg);
    cursor: pointer;
    line-height: 100%;
  }

  .info-card {
    padding: var(--space-3);
    border: var(--border-width) solid var(--color-border);
    background: var(--color-bg-elevated);
    box-sizing: border-box;
  }

  .info-title {
    font-size: var(--text-xs);
    font-weight: 600;
    letter-spacing: var(--tracking-label);
    color: var(--color-fg);
    margin-bottom: var(--space-1);
    line-height: 100%;
  }

  .info-desc {
    font-size: var(--text-xs);
    color: var(--color-fg-muted);
    margin: 0;
    line-height: 140%;
  }

  .prompt-textarea {
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

  .prompt-textarea:focus {
    outline: none;
    border-color: var(--color-fg);
  }

  .error-banner {
    padding: var(--space-2) var(--space-3);
    border: var(--border-width) solid var(--color-danger);
    background: var(--color-bg-elevated);
    color: var(--color-danger);
    font-size: var(--text-xs);
    line-height: 100%;
  }

  .modal-footer {
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--space-2);
    padding: 0 var(--space-3);
    box-shadow: inset 0 1px 0 0 var(--color-border);
    background: var(--color-bg-elevated);
    box-sizing: border-box;
  }
</style>
