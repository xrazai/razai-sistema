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
  import type { CreateCorInput } from '../../../shared/types'

  type Props = {
    oncancel: () => void
    onsave: (cor: CreateCorInput) => void | Promise<void>
  }

  let { oncancel, onsave }: Props = $props()

  let nome = $state('')
  let hex = $state('')
  let lab = $state('')
  let erroMsg = $state('')
  let isSaving = $state(false)

  // Swatches em tempo real derivados dos inputs
  let hexSwatch = $derived(isValidHex(hex) ? hex : null)
  let labSwatch = $derived(labToHex(lab))

  function handleHexInput(e: Event) {
    const target = e.target as HTMLInputElement
    const formatted = formatHexInput(target.value)
    hex = formatted

    // Se o LAB estiver vazio e tivermos um HEX completo válido, auto-sugere o LAB correspondente
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

    // Se o HEX estiver vazio e o LAB for válido, auto-preenche o HEX
    if (!hex && lab) {
      const calculatedHex = labToHex(lab)
      if (calculatedHex) {
        hex = calculatedHex
      }
    }
  }

  async function handleSubmit() {
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
      await onsave({
        nome: nome.trim(),
        hex: formattedHex,
        lab: lab.trim()
      })
    } catch (err: any) {
      erroMsg = err?.message || 'Erro ao cadastrar cor no banco de dados.'
    } finally {
      isSaving = false
    }
  }
</script>

<div class="cadastro-page">
  <Panel flush>
    {#snippet header()}
      <Breadcrumb
        items={[
          { label: 'Cores', onclick: oncancel },
          { label: 'Cadastro de Cor', active: true }
        ]}
      />
    {/snippet}
    {#snippet actions()}
      <Button variant="ghost" size="sm" onclick={oncancel} disabled={isSaving}>
        <Icon name="arrow-left" size="sm" />
        <span>Voltar para Lista</span>
      </Button>
    {/snippet}

    <div class="content-scroll">
      <div class="form-wrapper">
        <!-- Subheader informativo em largura total -->
        <div class="form-header">
          <div class="header-info">
            <span class="step-badge">NOVO REGISTRO</span>
            <span class="header-desc">
              Preencha o Nome da cor, o código HEX (#FFCC00) e os parâmetros do espaço LAB (00,00 / 00,00 / 00,00).
            </span>
          </div>
          {#if erroMsg}
            <Badge text={erroMsg} tone="danger" />
          {/if}
        </div>

        <form class="form-body" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <div class="grid-form">
            <div class="section-row">
              <header class="section-head">
                <span>01. Identificação e Especificação da Cor</span>
                <span class="head-rule">Campos obrigatórios</span>
              </header>
              <Grid cols={3} bare>
                <div class="field-cell">
                  <Label text="Nome da cor *" for="nome" />
                  <Input
                    id="nome"
                    bind:value={nome}
                    placeholder="Ex: Amarelo Canário, Azul Royal"
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

        <!-- Barra de rodapé com ações -->
        <footer class="form-footer">
          <Button variant="ghost" onclick={oncancel} disabled={isSaving}>
            Cancelar
          </Button>
          <Button variant="primary" onclick={handleSubmit} disabled={isSaving}>
            <span>{isSaving ? 'Salvando...' : 'Salvar Cor'}</span>
          </Button>
        </footer>
      </div>
    </div>
  </Panel>
</div>

<style>
  .cadastro-page {
    height: 100%;
    min-height: 0;
    display: grid;
    width: 100%;
  }

  .cadastro-page :global(.panel) {
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
    padding: 0 var(--space-4);
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

  .step-badge {
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-header);
    padding: 2px var(--space-2);
    background: var(--color-accent);
    color: var(--color-accent-fg);
    font-weight: 600;
  }

  .header-desc {
    font-size: var(--text-xs);
    color: var(--color-fg-muted);
    font-family: var(--font-mono);
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
    padding: 0 var(--space-4);
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
    padding: var(--space-3) var(--space-4);
    background: var(--color-bg);
    width: 100%;
    box-sizing: border-box;
  }

  .form-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--space-3);
    height: 56px;
    min-height: 56px;
    padding: 0 var(--space-4);
    background: var(--color-bg-elevated);
    border-top: var(--border-width) solid var(--color-border);
    width: 100%;
    box-sizing: border-box;
    line-height: 100%;
  }
</style>
