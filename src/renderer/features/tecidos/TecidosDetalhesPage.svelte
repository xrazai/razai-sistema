<script lang="ts">
  import Grid from '../../design-system/layout/Grid.svelte'
  import Label from '../../design-system/primitives/Label.svelte'
  import Button from '../../design-system/controls/Button.svelte'
  import Input from '../../design-system/controls/Input.svelte'
  import Select from '../../design-system/controls/Select.svelte'
  import Badge from '../../design-system/data-display/Badge.svelte'
  import { generateTecidoSku } from './utils'
  import type { TecidoRecord, UpdateTecidoInput } from '../../../shared/types'

  type Props = {
    tecido: TecidoRecord
    onback: () => void
    onsave: (id: string, input: UpdateTecidoInput) => void | Promise<void>
    ondelete: (id: string) => void | Promise<void>
  }

  let { tecido, onback, onsave, ondelete }: Props = $props()

  function formatNumeric(val: number | null | undefined): string {
    if (val === null || val === undefined || isNaN(val)) return ''
    return String(val).replace('.', ',')
  }

  // Estado dos campos do formulário
  let currentTecidoId = $state<string | null>(null)
  let nome = $state('')
  let composicao = $state('')
  let largura = $state('')
  let rendimento = $state('')
  let gramaturaLinear = $state('')
  let gramaturaM2 = $state('')
  let tipo = $state('')
  let transparencia = $state('')
  let elasticidade = $state('')
  let acabamento = $state('')
  let lastEditedMetric = $state<'rendimento' | 'gramaturaLinear' | 'gramaturaM2' | null>(null)
  let erroMsg = $state('')
  let isSaving = $state(false)
  let showDeleteConfirm = $state(false)

  $effect(() => {
    if (tecido.id !== currentTecidoId) {
      currentTecidoId = tecido.id
      nome = tecido.nome || ''
      composicao = tecido.composicao || ''
      largura = formatNumeric(tecido.largura)
      rendimento = formatNumeric(tecido.rendimento)
      gramaturaLinear = formatNumeric(tecido.gramaturaLinear)
      gramaturaM2 = formatNumeric(tecido.gramaturaM2)
      tipo = tecido.tipo || ''
      transparencia = tecido.transparencia || ''
      elasticidade = tecido.elasticidade || ''
      acabamento = tecido.acabamento || ''
      lastEditedMetric = null
      erroMsg = ''
      showDeleteConfirm = false
    }
  })

  // SKU dinâmico preliminar e código de exibição (mantém o código persistido caso o nome não tenha mudado)
  let skuDinamico = $derived(generateTecidoSku(nome))
  let codigoExibicao = $derived(nome === tecido.nome ? (tecido.codigo || skuDinamico) : skuDinamico)

  const tipoOptions = [
    { value: '', label: 'Selecione' },
    { value: 'liso', label: 'Liso' },
    { value: 'estampado', label: 'Estampado' }
  ]

  const transparenciaOptions = [
    { value: '', label: 'Selecione' },
    { value: 'nenhuma', label: 'Nenhuma' },
    { value: 'baixa', label: 'Baixa' },
    { value: 'media', label: 'Média' },
    { value: 'alta', label: 'Alta' }
  ]

  const elasticidadeOptions = [
    { value: '', label: 'Selecione' },
    { value: 'nenhuma', label: 'Nenhuma' },
    { value: 'baixa', label: 'Baixa' },
    { value: 'media', label: 'Média' },
    { value: 'alta', label: 'Alta' }
  ]

  const acabamentoOptions = [
    { value: '', label: 'Selecione' },
    { value: 'fosco', label: 'Fosco' },
    { value: 'semi_brilho', label: 'Semi-brilho' },
    { value: 'brilhante', label: 'Brilhante' }
  ]

  function parsePtBrNumber(val: string): number | null {
    if (!val || !val.trim()) return null
    const clean = val.replace(/\s+/g, '').replace(',', '.')
    const num = parseFloat(clean)
    return isNaN(num) || num <= 0 ? null : num
  }

  function roundGramatura(val: number): string {
    const rounded = Math.round(val / 10) * 10
    return String(rounded)
  }

  function roundRendimento(val: number): string {
    const rounded = Math.round(val * 2) / 2
    return rounded.toFixed(2).replace('.', ',')
  }

  function recalculateMetrics(source: 'largura' | 'rendimento' | 'gramaturaLinear' | 'gramaturaM2') {
    const L = parsePtBrNumber(largura)
    if (!L) return

    const activeMetric = source === 'largura' ? lastEditedMetric : source

    if (activeMetric === 'rendimento') {
      const R = parsePtBrNumber(rendimento)
      if (R) {
        const GL = 1000 / R
        const GM = GL / L
        gramaturaLinear = roundGramatura(GL)
        gramaturaM2 = roundGramatura(GM)
        if (source !== 'rendimento') {
          rendimento = roundRendimento(R)
        }
      }
    } else if (activeMetric === 'gramaturaLinear') {
      const GL = parsePtBrNumber(gramaturaLinear)
      if (GL) {
        const R = 1000 / GL
        const GM = GL / L
        rendimento = roundRendimento(R)
        gramaturaM2 = roundGramatura(GM)
        if (source !== 'gramaturaLinear') {
          gramaturaLinear = roundGramatura(GL)
        }
      }
    } else if (activeMetric === 'gramaturaM2') {
      const GM = parsePtBrNumber(gramaturaM2)
      if (GM) {
        const GL = GM * L
        const R = 1000 / GL
        gramaturaLinear = roundGramatura(GL)
        rendimento = roundRendimento(R)
        if (source !== 'gramaturaM2') {
          gramaturaM2 = roundGramatura(GM)
        }
      }
    }
  }

  function handleLarguraInput() {
    const activeMetric =
      lastEditedMetric ||
      (rendimento ? 'rendimento' : gramaturaM2 ? 'gramaturaM2' : gramaturaLinear ? 'gramaturaLinear' : null)
    if (activeMetric) {
      lastEditedMetric = activeMetric
      recalculateMetrics('largura')
    }
  }

  function handleRendimentoInput() {
    lastEditedMetric = 'rendimento'
    recalculateMetrics('rendimento')
  }

  function handleGramaturaLinearInput() {
    lastEditedMetric = 'gramaturaLinear'
    recalculateMetrics('gramaturaLinear')
  }

  function handleGramaturaM2Input() {
    lastEditedMetric = 'gramaturaM2'
    recalculateMetrics('gramaturaM2')
  }

  async function handleSubmit() {
    if (!nome.trim()) {
      erroMsg = 'O campo Nome é obrigatório.'
      return
    }

    if (!composicao.trim()) {
      erroMsg = 'O campo Composição é obrigatório.'
      return
    }

    const numLargura = parsePtBrNumber(largura)
    if (!numLargura) {
      erroMsg = 'O campo Largura (m) é obrigatório e deve ser um número válido.'
      return
    }

    const hasSecondaryNumeric =
      parsePtBrNumber(rendimento) !== null ||
      parsePtBrNumber(gramaturaLinear) !== null ||
      parsePtBrNumber(gramaturaM2) !== null

    if (!hasSecondaryNumeric) {
      erroMsg = 'Preencha ao menos mais um dado numérico na Seção 02: Rendimento, Gramatura linear ou Gramatura (g/m²).'
      return
    }

    erroMsg = ''
    isSaving = true
    try {
      await onsave(tecido.id, {
        nome: nome.trim(),
        composicao: composicao.trim(),
        largura: numLargura,
        rendimento: parsePtBrNumber(rendimento),
        gramaturaLinear: parsePtBrNumber(gramaturaLinear),
        gramaturaM2: parsePtBrNumber(gramaturaM2),
        tipo: tipo || null,
        transparencia: transparencia || null,
        elasticidade: elasticidade || null,
        acabamento: acabamento || null
      })
    } catch (err: any) {
      erroMsg = err?.message || 'Erro ao salvar alterações no banco.'
    } finally {
      isSaving = false
    }
  }

  async function handleDelete() {
    isSaving = true
    try {
      await ondelete(tecido.id)
    } catch (err: any) {
      erroMsg = err?.message || 'Erro ao excluir tecido.'
      isSaving = false
    }
  }
</script>

<div class="detalhes-page">
  <div class="content-scroll">
    <div class="form-wrapper">
      <form class="form-body" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <div class="grid-form">
          <!-- Linha 1: 2 colunas (Nome e Composição) -->
          <div class="section-row">
            <header class="section-head">
              <div class="head-title-wrap">
                <span>01. Identificação Básica</span>
                <span class="code-badge">{codigoExibicao}</span>
              </div>
              {#if erroMsg}
                <Badge text={erroMsg} tone="danger" />
              {:else}
                <span class="head-rule">Campos obrigatórios</span>
              {/if}
            </header>
              <Grid cols={2} bare>
                <div class="field-cell">
                  <Label text="Nome *" for="nome" />
                  <Input
                    id="nome"
                    bind:value={nome}
                    placeholder="Ex: Cetim com Elastano, Anarruga"
                  />
                </div>
                <div class="field-cell">
                  <Label text="Composição *" for="composicao" />
                  <Input
                    id="composicao"
                    bind:value={composicao}
                    placeholder="Ex: 100% Algodão, 97% Algodão 3% Elastano"
                  />
                </div>
              </Grid>
            </div>

            <!-- Linha 2: 4 colunas (Dimensões e Rendimento com Auto-cálculo) -->
            <div class="section-row">
              <header class="section-head">
                <span>02. Dimensões e Rendimento (Padrão Brasileiro)</span>
                <span class="head-rule">Largura obrigatória + ao menos 1 parâmetro numérico (auto-cálculo ativo)</span>
              </header>
              <Grid cols={4} bare>
                <div class="field-cell">
                  <Label text="Largura (m) *" for="largura" />
                  <Input
                    id="largura"
                    bind:value={largura}
                    placeholder="1,50"
                    suffix="m"
                    oninput={handleLarguraInput}
                  />
                </div>
                <div class="field-cell">
                  <Label text="Rendimento (m/kg)" for="rendimento" />
                  <Input
                    id="rendimento"
                    bind:value={rendimento}
                    placeholder="2,80"
                    suffix="m/kg"
                    oninput={handleRendimentoInput}
                  />
                </div>
                <div class="field-cell">
                  <Label text="Gramatura (linear)" for="gramaturaLinear" />
                  <Input
                    id="gramaturaLinear"
                    bind:value={gramaturaLinear}
                    placeholder="270"
                    suffix="g/m"
                    oninput={handleGramaturaLinearInput}
                  />
                </div>
                <div class="field-cell">
                  <Label text="Gramatura (g/m²)" for="gramaturaM2" />
                  <Input
                    id="gramaturaM2"
                    bind:value={gramaturaM2}
                    placeholder="180"
                    suffix="g/m²"
                    oninput={handleGramaturaM2Input}
                  />
                </div>
              </Grid>
            </div>

            <!-- Linha 3: 4 colunas (Propriedades Físicas e Acabamento) -->
            <div class="section-row">
              <header class="section-head">
                <span>03. Propriedades e Acabamento</span>
                <span class="head-rule">Classificação técnica</span>
              </header>
              <Grid cols={4} bare>
                <div class="field-cell">
                  <Label text="Tipo" for="tipo" />
                  <Select
                    id="tipo"
                    bind:value={tipo}
                    options={tipoOptions}
                  />
                </div>
                <div class="field-cell">
                  <Label text="Transparência" for="transparencia" />
                  <Select
                    id="transparencia"
                    bind:value={transparencia}
                    options={transparenciaOptions}
                  />
                </div>
                <div class="field-cell">
                  <Label text="Elasticidade" for="elasticidade" />
                  <Select
                    id="elasticidade"
                    bind:value={elasticidade}
                    options={elasticidadeOptions}
                  />
                </div>
                <div class="field-cell">
                  <Label text="Acabamento" for="acabamento" />
                  <Select
                    id="acabamento"
                    bind:value={acabamento}
                    options={acabamentoOptions}
                  />
                </div>
              </Grid>
            </div>
          </div>
        </form>

        <!-- Barra de rodapé com ações -->
        <footer class="form-footer">
          <div class="footer-left">
            <Button variant="danger" onclick={() => (showDeleteConfirm = true)} disabled={isSaving}>
              <span>Excluir Tecido</span>
            </Button>
          </div>
          <div class="footer-right">
            <Button variant="ghost" onclick={onback} disabled={isSaving}>
              Cancelar
            </Button>
            <Button variant="primary" onclick={handleSubmit} disabled={isSaving}>
              <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
            </Button>
          </div>
        </footer>
      </div>
    </div>
</div>

{#if showDeleteConfirm}
  <div
    class="modal-backdrop"
    role="presentation"
    onclick={() => (showDeleteConfirm = false)}
    onkeydown={(e) => { if (e.key === 'Escape') showDeleteConfirm = false }}
  >
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
      class="modal-dialog"
      role="alertdialog"
      tabindex="-1"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-desc"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => { if (e.key === 'Escape') showDeleteConfirm = false }}
    >
      <header class="modal-header">
        <span id="modal-title" class="modal-title">Confirmar Exclusão Definitiva</span>
        <button
          type="button"
          class="modal-close"
          onclick={() => (showDeleteConfirm = false)}
          aria-label="Fechar"
        >
          ✕
        </button>
      </header>

      <div class="modal-body">
        <div class="danger-banner">
          <p id="modal-desc" class="warning-text">
            Esta operação é irreversível. O tecido e todos os seus dados técnicos serão removidos permanentemente.
          </p>
        </div>

        <div class="item-summary">
          <div class="summary-row">
            <span class="summary-label">Código SKU:</span>
            <span class="summary-value code-accent">{codigoExibicao}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Nome:</span>
            <span class="summary-value">{nome || tecido.nome}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Composição:</span>
            <span class="summary-value">{composicao || tecido.composicao}</span>
          </div>
        </div>
      </div>

      <footer class="modal-footer">
        <Button variant="ghost" onclick={() => (showDeleteConfirm = false)} disabled={isSaving}>
          <span>Cancelar Exclusão</span>
        </Button>
        <Button variant="danger" onclick={handleDelete} disabled={isSaving}>
          <span>Confirmar Exclusão</span>
        </Button>
      </footer>
    </div>
  </div>
{/if}

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

  .section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 40px;
    min-height: 40px;
    padding: var(--space-2) var(--space-4);
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

  .head-title-wrap {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .code-badge {
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-header);
    padding: 2px var(--space-2);
    background: var(--color-accent);
    color: var(--color-accent-fg);
    font-weight: 700;
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
    gap: var(--space-3);
    height: 80px;
    min-height: 56px;
    padding: var(--space-3) var(--space-4);
    background: var(--color-bg-elevated);
    border-top: var(--border-width) solid var(--color-border);
    width: 100%;
    box-sizing: border-box;
    line-height: 100%;
  }

  .footer-left {
    display: flex;
    align-items: center;
  }

  .footer-right {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  .modal-dialog {
    background: var(--color-bg);
    border: var(--border-width) solid var(--color-danger);
    width: 100%;
    max-width: 480px;
    box-sizing: border-box;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 48px;
    min-height: 48px;
    padding: var(--space-2) var(--space-4);
    background: var(--color-bg-elevated);
    border-bottom: var(--border-width) solid var(--color-border);
    line-height: 100%;
    box-sizing: border-box;
  }

  .modal-title {
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-header);
    text-transform: uppercase;
    color: var(--color-danger);
    font-weight: 700;
    font-family: var(--font-mono);
  }

  .modal-close {
    border: none;
    background: transparent;
    color: var(--color-fg-muted);
    cursor: pointer;
    font-size: var(--text-xs);
    padding: var(--space-1);
  }

  .modal-close:hover {
    color: var(--color-fg);
  }

  .modal-body {
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .danger-banner {
    padding: var(--space-2) var(--space-3);
    background: var(--color-bg-sunken);
    border-left: 2px solid var(--color-danger);
  }

  .warning-text {
    font-size: var(--text-xs);
    color: var(--color-fg-muted);
    font-family: var(--font-mono);
    margin: 0;
    line-height: var(--leading-normal);
  }

  .item-summary {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    border: var(--border-width) solid var(--color-border);
    padding: var(--space-3);
    background: var(--color-bg-sunken);
  }

  .summary-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: var(--text-xs);
    font-family: var(--font-mono);
  }

  .summary-label {
    color: var(--color-fg-dim);
    text-transform: uppercase;
    letter-spacing: var(--tracking-label);
  }

  .summary-value {
    color: var(--color-fg);
    font-weight: 500;
  }

  .summary-value.code-accent {
    color: var(--color-accent);
    font-weight: 700;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4);
    background: var(--color-bg-elevated);
    border-top: var(--border-width) solid var(--color-border);
  }
</style>
