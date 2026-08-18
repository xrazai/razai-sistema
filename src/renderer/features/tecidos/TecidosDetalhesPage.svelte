<script lang="ts">
  import Panel from '../../design-system/layout/Panel.svelte'
  import Stack from '../../design-system/layout/Stack.svelte'
  import Grid from '../../design-system/layout/Grid.svelte'
  import Label from '../../design-system/primitives/Label.svelte'
  import Icon from '../../design-system/primitives/Icon.svelte'
  import Button from '../../design-system/controls/Button.svelte'
  import Input from '../../design-system/controls/Input.svelte'
  import Select from '../../design-system/controls/Select.svelte'
  import Badge from '../../design-system/data-display/Badge.svelte'

  export type Tecido = {
    id: string
    codigo: string
    nome: string
    composicao: string
    gramatura: string
    largura: string
    fornecedor: string
    status: 'ativo' | 'inativo' | 'esgotado'
    rendimento?: string
    gramaturaLinear?: string
    tipo?: string
    transparencia?: string
    elasticidade?: string
    acabamento?: string
  }

  type Props = {
    tecido: Tecido
    onback: () => void
    onsave: (tecido: Tecido) => void
    ondelete: (id: string) => void
  }

  let { tecido, onback, onsave, ondelete }: Props = $props()

  // Extrair valores limpos (sem sufixos como "m" ou "g/m²" se já existirem)
  function cleanNumeric(val: string | undefined): string {
    if (!val) return ''
    return val.replace(/[^\d,\.]/g, '').trim()
  }

  // Estado dos campos
  let nome = $state('')
  let composicao = $state('')
  let largura = $state('')
  let rendimento = $state('')
  let gramaturaLinear = $state('')
  let gramaturaM2 = $state('')
  let fornecedor = $state('')
  let status = $state<'ativo' | 'inativo' | 'esgotado'>('ativo')
  let tipo = $state('')
  let transparencia = $state('')
  let elasticidade = $state('')
  let acabamento = $state('')

  $effect(() => {
    nome = tecido.nome
    composicao = tecido.composicao
    largura = cleanNumeric(tecido.largura)
    rendimento = cleanNumeric(tecido.rendimento)
    gramaturaLinear = cleanNumeric(tecido.gramaturaLinear)
    gramaturaM2 = cleanNumeric(tecido.gramatura)
    fornecedor = tecido.fornecedor || ''
    status = tecido.status
    tipo = tecido.tipo || ''
    transparencia = tecido.transparencia || ''
    elasticidade = tecido.elasticidade || ''
    acabamento = tecido.acabamento || ''
  })

  let lastEditedMetric = $state<'rendimento' | 'gramaturaLinear' | 'gramaturaM2' | null>(null)
  let erroMsg = $state('')
  let showDeleteConfirm = $state(false)

  const statusOptions = [
    { value: 'ativo', label: 'Ativo' },
    { value: 'esgotado', label: 'Esgotado' },
    { value: 'inativo', label: 'Inativo' }
  ]

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
    if (lastEditedMetric) {
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

  function handleSubmit() {
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

    erroMsg = ''
    onsave({
      ...tecido,
      nome: nome.trim(),
      composicao: composicao.trim(),
      largura: largura.trim() ? `${largura.trim()} m` : '—',
      rendimento: rendimento.trim() ? `${rendimento.trim()} m/kg` : undefined,
      gramaturaLinear: gramaturaLinear.trim() ? `${gramaturaLinear.trim()} g/m` : undefined,
      gramatura: gramaturaM2.trim() ? `${gramaturaM2.trim()} g/m²` : '—',
      fornecedor: fornecedor.trim() || '—',
      status,
      tipo: tipo || undefined,
      transparencia: transparencia || undefined,
      elasticidade: elasticidade || undefined,
      acabamento: acabamento || undefined
    })
  }

  function handleDelete() {
    ondelete(tecido.id)
  }
</script>

<div class="detalhes-page">
  <Panel title={`Tecidos / Detalhes: ${tecido.codigo} — ${tecido.nome}`} flush>
    {#snippet actions()}
      <Stack direction="horizontal" gap="2">
        <Button variant="ghost" size="sm" onclick={onback}>
          <Icon name="arrow-left" size="sm" />
          <span>Voltar para Lista</span>
        </Button>
        {#if showDeleteConfirm}
          <Button variant="ghost" size="sm" onclick={() => (showDeleteConfirm = false)}>
            <span>Cancelar Exclusão</span>
          </Button>
          <Button variant="primary" size="sm" onclick={handleDelete}>
            <span>Confirmar Exclusão</span>
          </Button>
        {:else}
          <Button variant="ghost" size="sm" onclick={() => (showDeleteConfirm = true)}>
            <span>Excluir Tecido</span>
          </Button>
        {/if}
        <Button variant="primary" size="sm" onclick={handleSubmit}>
          <span>Salvar Alterações</span>
        </Button>
      </Stack>
    {/snippet}

    <div class="content-scroll">
      <div class="form-wrapper">
        <!-- Subheader informativo -->
        <div class="form-header">
          <div class="header-info">
            <span class="code-badge">{tecido.codigo}</span>
            <span class="header-desc">
              Edite as especificações técnicas e parâmetros do tecido. O auto-cálculo mantém a coerência das dimensões.
            </span>
          </div>
          {#if erroMsg}
            <Badge text={erroMsg} tone="danger" />
          {/if}
        </div>

        <form class="form-body" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <div class="grid-form">
            <!-- Linha 1: 3 colunas (Identificação Básica + Status) -->
            <div class="section-row">
              <header class="section-head">
                <span>01. Identificação Básica</span>
                <span class="head-rule">Informações cadastrais</span>
              </header>
              <Grid cols={3} bare>
                <div class="field-cell">
                  <Label text="Nome *" for="nome" />
                  <Input
                    id="nome"
                    bind:value={nome}
                    placeholder="Ex: Tricoline Lisa"
                  />
                </div>
                <div class="field-cell">
                  <Label text="Composição *" for="composicao" />
                  <Input
                    id="composicao"
                    bind:value={composicao}
                    placeholder="Ex: 100% Algodão"
                  />
                </div>
                <div class="field-cell">
                  <Label text="Status" for="status" />
                  <Select
                    id="status"
                    bind:value={status}
                    options={statusOptions}
                  />
                </div>
              </Grid>
            </div>

            <!-- Linha 2: 4 colunas (Dimensões e Rendimento) -->
            <div class="section-row">
              <header class="section-head">
                <span>02. Dimensões e Rendimento (Padrão Brasileiro)</span>
                <span class="head-rule">Auto-cálculo e arredondamento industrial ativo</span>
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

            <!-- Linha 3: 4 colunas (Propriedades Físicas, Acabamento e Fornecedor) -->
            <div class="section-row">
              <header class="section-head">
                <span>03. Propriedades Técnicas e Fornecedor</span>
                <span class="head-rule">Classificação e procedência</span>
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

            <!-- Linha 4: 1 coluna para Fornecedor -->
            <div class="section-row">
              <header class="section-head">
                <span>04. Fornecedor e Origem</span>
              </header>
              <Grid cols={2} bare>
                <div class="field-cell">
                  <Label text="Fornecedor / Fabricante" for="fornecedor" />
                  <Input
                    id="fornecedor"
                    bind:value={fornecedor}
                    placeholder="Ex: Têxtil Santa Catarina, Vicunha"
                  />
                </div>
                <div class="field-cell readonly-info">
                  <Label text="Identificador do Sistema" />
                  <div class="id-display">ID: {tecido.id} · Ref: {tecido.codigo}</div>
                </div>
              </Grid>
            </div>
          </div>
        </form>

        <!-- Barra de rodapé com ações -->
        <footer class="form-footer">
          <Button variant="ghost" onclick={onback}>
            Cancelar
          </Button>
          <Button variant="primary" onclick={handleSubmit}>
            Salvar Alterações
          </Button>
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
    padding: var(--space-2) var(--space-3);
    background: var(--color-bg-sunken);
    border-bottom: var(--border-width) solid var(--color-border);
    width: 100%;
    box-sizing: border-box;
  }

  .header-info {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .code-badge {
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-header);
    padding: 2px var(--space-2);
    background: var(--color-accent);
    color: var(--color-accent-fg);
    font-weight: 700;
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
    padding: var(--space-1) var(--space-3);
    background: var(--color-bg-elevated);
    border-bottom: var(--border-width) solid var(--color-border);
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-header);
    text-transform: uppercase;
    color: var(--color-fg-dim);
    font-family: var(--font-mono);
  }

  .head-rule {
    font-size: var(--text-xs);
    color: var(--color-fg-dim);
    letter-spacing: var(--tracking-tight);
    text-transform: none;
  }

  .field-cell {
    padding: var(--space-3);
    background: var(--color-bg);
    width: 100%;
    box-sizing: border-box;
  }

  .readonly-info {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .id-display {
    font-size: var(--text-xs);
    color: var(--color-fg-muted);
    font-family: var(--font-mono);
    padding-top: var(--space-1);
  }

  .form-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--space-3);
    padding: var(--space-3);
    background: var(--color-bg-elevated);
    border-top: var(--border-width) solid var(--color-border);
    width: 100%;
    box-sizing: border-box;
  }
</style>
