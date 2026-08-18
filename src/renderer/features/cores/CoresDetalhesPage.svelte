<script lang="ts">
  import Panel from '../../design-system/layout/Panel.svelte'
  import Grid from '../../design-system/layout/Grid.svelte'
  import Label from '../../design-system/primitives/Label.svelte'
  import Icon from '../../design-system/primitives/Icon.svelte'
  import Button from '../../design-system/controls/Button.svelte'
  import Input from '../../design-system/controls/Input.svelte'
  import Badge from '../../design-system/data-display/Badge.svelte'
  import Breadcrumb from '../../design-system/navigation/Breadcrumb.svelte'
  import { formatHexInput, isValidHex, labToHex, hexToLab } from './utils'
  import type { CorRecord, UpdateCorInput } from '../../../shared/types'

  type Props = {
    cor: CorRecord
    onback: () => void
    onsave: (id: string, input: UpdateCorInput) => void | Promise<void>
    ondelete: (id: string) => void | Promise<void>
  }

  let { cor, onback, onsave, ondelete }: Props = $props()

  let currentCorId = $state<string | null>(null)
  let nome = $state('')
  let hex = $state('')
  let lab = $state('')
  let erroMsg = $state('')
  let isSaving = $state(false)
  let showDeleteConfirm = $state(false)

  $effect(() => {
    if (cor.id !== currentCorId) {
      currentCorId = cor.id
      nome = cor.nome || ''
      hex = cor.hex || ''
      lab = cor.lab || ''
      erroMsg = ''
      showDeleteConfirm = false
    }
  })

  // Swatches dinâmicos baseados no estado atual dos inputs
  let hexSwatch = $derived(isValidHex(hex) ? hex : null)
  let labSwatch = $derived(labToHex(lab))

  function handleHexInput(e: Event) {
    const target = e.target as HTMLInputElement
    const formatted = formatHexInput(target.value)
    hex = formatted

    if (isValidHex(formatted) && !lab) {
      const calculatedLab = hexToLab(formatted)
      if (calculatedLab) {
        lab = calculatedLab
      }
    }
  }

  function handleLabInput(e: Event) {
    const target = e.target as HTMLInputElement
    lab = target.value

    if (!hex && lab) {
      const calculatedHex = labToHex(lab)
      if (calculatedHex) {
        hex = calculatedHex
      }
    }
  }

  async function handleSave() {
    if (!nome.trim()) {
      erroMsg = 'O campo "Nome da cor" é obrigatório.'
      return
    }

    const formattedHex = formatHexInput(hex)
    if (!isValidHex(formattedHex)) {
      erroMsg = 'O código HEX deve ter o formato #RRGGBB em maiúsculas (ex: #FFCC00).'
      return
    }

    if (!lab.trim()) {
      erroMsg = 'O campo "LAB" é obrigatório (formato 00,00 / 00,00 / 00,00).'
      return
    }

    erroMsg = ''
    isSaving = true
    try {
      await onsave(cor.id, {
        nome: nome.trim(),
        hex: formattedHex,
        lab: lab.trim()
      })
    } catch (err: any) {
      erroMsg = err?.message || 'Erro ao atualizar dados da cor.'
    } finally {
      isSaving = false
    }
  }

  async function handleDelete() {
    isSaving = true
    try {
      await ondelete(cor.id)
    } catch (err: any) {
      erroMsg = err?.message || 'Erro ao excluir a cor.'
      isSaving = false
    }
  }
</script>

<div class="detalhes-page">
  <Panel flush>
    {#snippet header()}
      <Breadcrumb
        items={[
          { label: 'Cores', onclick: onback },
          { label: cor.nome || 'Detalhes da Cor', active: true }
        ]}
      />
    {/snippet}
    {#snippet actions()}
      <Button variant="ghost" size="sm" onclick={onback} disabled={isSaving}>
        <Icon name="arrow-left" size="sm" />
        <span>Voltar para Lista</span>
      </Button>
    {/snippet}

    <div class="content-scroll">
      <div class="form-wrapper">
        <div class="form-header">
          <div class="header-info">
            <div
              class="color-indicator-swatch"
              style:background-color={isValidHex(hex) ? hex : cor.hex}
            ></div>
            <div class="title-meta">
              <span class="cor-title">{cor.nome}</span>
              <span class="cor-hex-tag">{cor.hex}</span>
            </div>
          </div>
          <div class="header-status">
            {#if erroMsg}
              <Badge text={erroMsg} tone="danger" />
            {/if}
          </div>
        </div>

        {#if showDeleteConfirm}
          <div class="delete-banner">
            <div class="delete-banner-text">
              <span>Deseja realmente excluir permanentemente a cor <strong>{cor.nome}</strong> ({cor.hex})?</span>
            </div>
            <div class="delete-banner-actions">
              <Button variant="ghost" size="sm" onclick={() => (showDeleteConfirm = false)} disabled={isSaving}>
                Cancelar
              </Button>
              <Button variant="danger" size="sm" onclick={handleDelete} disabled={isSaving}>
                <span>{isSaving ? 'Excluindo...' : 'Confirmar Exclusão'}</span>
              </Button>
            </div>
          </div>
        {/if}

        <form class="form-body" onsubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <div class="grid-form">
            <div class="section-row">
              <header class="section-head">
                <span>01. Identificação e Especificação da Cor</span>
                <span class="head-rule">Edição cadastral</span>
              </header>
              <Grid cols={3} bare>
                <div class="field-cell">
                  <Label text="Nome da cor *" for="nome" />
                  <Input
                    id="nome"
                    bind:value={nome}
                    placeholder="Ex: Amarelo Canário"
                  />
                </div>
                <div class="field-cell">
                  <Label text="HEX *" for="hex" />
                  <Input
                    id="hex"
                    value={hex}
                    oninput={handleHexInput}
                    placeholder="#FFCC00"
                    swatch={hexSwatch}
                  />
                </div>
                <div class="field-cell">
                  <Label text="LAB *" for="lab" />
                  <Input
                    id="lab"
                    value={lab}
                    oninput={handleLabInput}
                    placeholder="00,00 / 00,00 / 00,00"
                    swatch={labSwatch}
                  />
                </div>
              </Grid>
            </div>
          </div>
        </form>

        <footer class="form-footer">
          <div class="footer-left">
            <Button
              variant="danger"
              onclick={() => (showDeleteConfirm = true)}
              disabled={isSaving || showDeleteConfirm}
            >
              <span>Excluir Cor</span>
            </Button>
          </div>
          <div class="footer-right">
            <Button variant="ghost" onclick={onback} disabled={isSaving}>
              Cancelar
            </Button>
            <Button variant="primary" onclick={handleSave} disabled={isSaving}>
              <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
            </Button>
          </div>
        </footer>
      </div>
    </div>
  </Panel>
</div>

<style>
  .detalhes-page {
    height: 100%;
    min-height: 0;
    display: grid;
    width: 100%;
  }

  .detalhes-page :global(.panel) {
    height: 100%;
    min-height: 0;
    width: 100%;
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

  .form-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    height: 48px;
    min-height: 48px;
    padding: var(--space-2) var(--space-4);
    background: var(--color-bg-sunken);
    border-bottom: var(--border-width) solid var(--color-border);
    width: 100%;
    box-sizing: border-box;
    line-height: 100%;
  }

  .header-info {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .color-indicator-swatch {
    width: 24px;
    height: 24px;
    border: var(--border-width) solid var(--color-border-strong);
    box-sizing: border-box;
  }

  .title-meta {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .cor-title {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-fg);
  }

  .cor-hex-tag {
    font-size: var(--text-xs);
    font-family: var(--font-mono);
    color: var(--color-accent);
    font-weight: 700;
  }

  .delete-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-3) var(--space-4);
    background: var(--color-bg-danger-subtle, rgba(239, 68, 68, 0.1));
    border-bottom: var(--border-width) solid var(--color-danger);
    color: var(--color-danger);
    font-size: var(--text-xs);
  }

  .delete-banner-text {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .delete-banner-actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .form-body {
    display: flex;
    flex-direction: column;
    width: 100%;
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
    border-bottom: var(--border-width) solid var(--color-border);
  }

  .section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 32px;
    min-height: 32px;
    padding: var(--space-1) var(--space-4);
    background: var(--color-bg-elevated);
    border-bottom: var(--border-width) solid var(--color-border);
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

  .field-cell {
    padding: var(--space-3) var(--space-4) var(--space-4) var(--space-4);
    background: var(--color-bg);
    width: 100%;
    box-sizing: border-box;
  }

  .form-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 80px;
    min-height: 56px;
    padding: var(--space-3) var(--space-4);
    background: var(--color-bg-elevated);
    border-top: var(--border-width) solid var(--color-border);
    width: 100%;
    box-sizing: border-box;
    line-height: 100%;
  }

  .footer-right {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }
</style>
