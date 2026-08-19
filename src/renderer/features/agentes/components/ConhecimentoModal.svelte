<script lang="ts">
  import { untrack } from 'svelte'
  import Button from '../../../design-system/controls/Button.svelte'
  import Input from '../../../design-system/controls/Input.svelte'
  import Select from '../../../design-system/controls/Select.svelte'
  import type {
    AgenteConhecimentoRecord,
    CreateAgenteConhecimentoInput,
    UpdateAgenteConhecimentoInput
  } from '../../../../shared/types'

  type Props = {
    agenteId: string
    conhecimento?: AgenteConhecimentoRecord | null
    onclose: () => void
    onsave: (saved: AgenteConhecimentoRecord) => void
  }

  let { agenteId, conhecimento = null, onclose, onsave }: Props = $props()

  let isEditing = $derived(Boolean(conhecimento?.id))

  let tipo = $state(untrack(() => conhecimento?.tipo || 'faq'))
  let titulo = $state(untrack(() => conhecimento?.titulo || ''))
  let conteudo = $state(untrack(() => conhecimento?.conteudo || ''))
  let ativo = $state(untrack(() => (conhecimento ? conhecimento.ativo : true)))
  let ordem = $state(untrack(() => conhecimento?.ordem || 0))

  let isSaving = $state(false)
  let errorMsg = $state<string | null>(null)

  const tipoOptions = [
    { value: 'faq', label: 'FAQ (Pergunta e Resposta Frequente)' },
    { value: 'politica', label: 'Política da Loja (Envio, Prazos, Trocas)' },
    { value: 'manual_produto', label: 'Manual / Características de Tecidos' },
    { value: 'texto_livre', label: 'Documento / Texto Livre' }
  ]

  async function handleSubmit() {
    errorMsg = null
    if (!titulo.trim()) {
      errorMsg = 'O título é obrigatório.'
      return
    }
    if (!conteudo.trim()) {
      errorMsg = 'O conteúdo do conhecimento é obrigatório.'
      return
    }

    isSaving = true
    try {
      if (isEditing && conhecimento) {
        const updateInput: UpdateAgenteConhecimentoInput = {
          tipo: tipo as any,
          titulo: titulo.trim(),
          conteudo: conteudo.trim(),
          ativo,
          ordem: Number(ordem) || 0
        }
        const updated = await window.razai.agentes.updateConhecimento(conhecimento.id, updateInput)
        onsave(updated)
      } else {
        const createInput: CreateAgenteConhecimentoInput = {
          agenteId,
          tipo: tipo as any,
          titulo: titulo.trim(),
          conteudo: conteudo.trim(),
          ativo,
          ordem: Number(ordem) || 0
        }
        const created = await window.razai.agentes.createConhecimento(createInput)
        onsave(created)
      }
    } catch (err: any) {
      errorMsg = err.message || 'Erro ao salvar item de conhecimento.'
    } finally {
      isSaving = false
    }
  }
</script>

<div class="modal-backdrop" role="dialog" aria-modal="true">
  <div class="modal-box">
    <header class="modal-header">
      <div class="header-title">
        <span class="prefix">CONHECIMENTO //</span>
        <h2>{isEditing ? `EDITAR // ${conhecimento?.titulo}` : 'NOVO ITEM DE CONHECIMENTO'}</h2>
      </div>
      <button class="close-btn" onclick={onclose} aria-label="Fechar">✕</button>
    </header>

    <div class="modal-body">
      {#if errorMsg}
        <div class="error-banner">
          <span>{errorMsg}</span>
        </div>
      {/if}

      <div class="form-grid">
        <div class="field-row">
          <label class="field-label" for="kn-tipo">Tipo de Conhecimento</label>
          <Select id="kn-tipo" bind:value={tipo} options={tipoOptions} />
        </div>

        <div class="field-row">
          <label class="field-label" for="kn-titulo">Título / Pergunta *</label>
          <Input
            id="kn-titulo"
            bind:value={titulo}
            placeholder="Ex: Qual o prazo de postagem e envio?"
          />
        </div>

        <div class="field-row">
          <label class="field-label" for="kn-conteudo">Conteúdo / Resposta / Regra *</label>
          <textarea
            id="kn-conteudo"
            class="content-textarea"
            bind:value={conteudo}
            rows="6"
            placeholder="Descreva detalhadamente a regra ou resposta que o agente deve usar..."
          ></textarea>
        </div>

        <div class="field-row checkbox-row">
          <label class="checkbox-label">
            <input type="checkbox" bind:checked={ativo} />
            <span>Regra Ativa (Utilizada no contexto da IA)</span>
          </label>
        </div>
      </div>
    </div>

    <footer class="modal-footer">
      <Button variant="secondary" onclick={onclose} disabled={isSaving}>CANCELAR</Button>
      <Button variant="primary" onclick={handleSubmit} disabled={isSaving}>
        {isSaving ? 'SALVANDO...' : isEditing ? 'SALVAR ALTERAÇÕES' : 'ADICIONAR ITEM'}
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
    width: 580px;
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

  .modal-body {
    padding: var(--space-4);
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

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-xs);
    color: var(--color-fg);
    cursor: pointer;
    line-height: 100%;
  }

  .content-textarea {
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

  .content-textarea:focus {
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
