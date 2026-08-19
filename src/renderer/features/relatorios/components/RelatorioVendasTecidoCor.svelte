<script lang="ts">
  import { onMount } from 'svelte'
  import Stack from '../../../design-system/layout/Stack.svelte'
  import Panel from '../../../design-system/layout/Panel.svelte'
  import Metric from '../../../design-system/data-display/Metric.svelte'
  import Button from '../../../design-system/controls/Button.svelte'
  import Input from '../../../design-system/controls/Input.svelte'
  import Icon from '../../../design-system/primitives/Icon.svelte'
  import Badge from '../../../design-system/data-display/Badge.svelte'
  import EmptyState from '../../../design-system/compositions/EmptyState.svelte'
  import { router } from '../../../shell/router.svelte'
  import type { RelatorioVendasTecidoCor, RelatorioTecidoItem } from '../../../../shared/types'

  type Preset = 'tudo' | 'hoje' | 'ontem' | '7dias' | '30dias' | 'mes'

  let activePreset = $state<Preset>('tudo')
  let dataInicio = $state('')
  let dataFim = $state('')
  let searchTerm = $state('')

  let relatorio = $state<RelatorioVendasTecidoCor | null>(null)
  let isLoading = $state(true)
  let errorMsg = $state<string | null>(null)
  let expandedTecidos = $state<Record<string, boolean>>({})

  function formatDateLocal(d: Date): string {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  function applyPreset(preset: Preset) {
    activePreset = preset
    const now = new Date()

    if (preset === 'tudo') {
      dataInicio = ''
      dataFim = ''
    } else if (preset === 'hoje') {
      const today = formatDateLocal(now)
      dataInicio = today
      dataFim = today
    } else if (preset === 'ontem') {
      const ontem = new Date(now)
      ontem.setDate(ontem.getDate() - 1)
      const ontemStr = formatDateLocal(ontem)
      dataInicio = ontemStr
      dataFim = ontemStr
    } else if (preset === '7dias') {
      const d7 = new Date(now)
      d7.setDate(d7.getDate() - 6)
      dataInicio = formatDateLocal(d7)
      dataFim = formatDateLocal(now)
    } else if (preset === '30dias') {
      const d30 = new Date(now)
      d30.setDate(d30.getDate() - 29)
      dataInicio = formatDateLocal(d30)
      dataFim = formatDateLocal(now)
    } else if (preset === 'mes') {
      const dMes = new Date(now.getFullYear(), now.getMonth(), 1)
      dataInicio = formatDateLocal(dMes)
      dataFim = formatDateLocal(now)
    }

    loadReport()
  }

  async function loadReport() {
    isLoading = true
    errorMsg = null
    try {
      if (typeof window !== 'undefined' && window.razai?.relatorios) {
        const filtro = {
          dataInicio: dataInicio || undefined,
          dataFim: dataFim || undefined
        }
        relatorio = await window.razai.relatorios.getVendasPorTecidoCor(filtro)

        // Por padrão, expande todos os tecidos para visualização rápida
        const initialExpanded: Record<string, boolean> = {}
        if (relatorio?.tecidos) {
          for (const t of relatorio.tecidos) {
            initialExpanded[t.tecidoId] = true
          }
        }
        expandedTecidos = initialExpanded
      }
    } catch (err: any) {
      console.error('Erro ao carregar relatório:', err)
      errorMsg = err?.message || 'Falha ao buscar dados analíticos.'
    } finally {
      isLoading = false
    }
  }

  function toggleTecido(tecidoId: string) {
    expandedTecidos = {
      ...expandedTecidos,
      [tecidoId]: !expandedTecidos[tecidoId]
    }
  }

  function toggleAll(expand: boolean) {
    const next: Record<string, boolean> = {}
    if (relatorio?.tecidos) {
      for (const t of relatorio.tecidos) {
        next[t.tecidoId] = expand
      }
    }
    expandedTecidos = next
  }

  const filteredTecidos = $derived.by<RelatorioTecidoItem[]>(() => {
    if (!relatorio?.tecidos) return []
    const term = searchTerm.trim().toLowerCase()
    if (!term) return relatorio.tecidos

    return relatorio.tecidos.filter((t) => {
      const matchTecido =
        t.tecidoNome.toLowerCase().includes(term) ||
        t.tecidoCodigo.toLowerCase().includes(term)
      const matchCor = t.cores.some(
        (c) =>
          c.corNome.toLowerCase().includes(term) ||
          c.corCodigo.toLowerCase().includes(term)
      )
      return matchTecido || matchCor
    })
  })

  const hasAllExpanded = $derived.by(() => {
    if (!relatorio?.tecidos || relatorio.tecidos.length === 0) return false
    return relatorio.tecidos.every((t) => expandedTecidos[t.tecidoId])
  })

  function formatCurrency(val: number): string {
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  onMount(() => {
    loadReport()
  })
</script>

<div class="report-view">
  <!-- Toolbar Superior -->
  <div class="report-toolbar">
    <div class="toolbar-left">
      <Button variant="ghost" size="sm" onclick={() => router.navigate('#relatorios')}>
        <Icon name="arrow-left" size="sm" />
        <span>Hub</span>
      </Button>
      <div class="divider-v"></div>
      <Icon name="reports" />
      <span class="toolbar-title">RELATÓRIO / VENDAS POR TECIDO E COR</span>
    </div>

    <div class="toolbar-right">
      <Button
        variant="ghost"
        size="sm"
        onclick={() => toggleAll(!hasAllExpanded)}
        disabled={!relatorio?.tecidos?.length}
      >
        <span>{hasAllExpanded ? 'Recolher Todos' : 'Expandir Todos'}</span>
      </Button>
      <Button variant="primary" size="sm" onclick={loadReport} disabled={isLoading}>
        <Icon name="check" size="sm" />
        <span>Atualizar</span>
      </Button>
    </div>
  </div>

  <div class="report-content">
    <Stack gap="4">
      <!-- Painel de Filtros e Presets de Data -->
      <Panel title="Filtros de Período & Busca">
        <div class="filters-container">
          <div class="presets-row">
            <span class="filter-label">PRESETS:</span>
            <div class="presets-buttons">
              <Button
                variant={activePreset === 'tudo' ? 'primary' : 'ghost'}
                size="sm"
                onclick={() => applyPreset('tudo')}
              >
                Tudo
              </Button>
              <Button
                variant={activePreset === 'hoje' ? 'primary' : 'ghost'}
                size="sm"
                onclick={() => applyPreset('hoje')}
              >
                Hoje
              </Button>
              <Button
                variant={activePreset === 'ontem' ? 'primary' : 'ghost'}
                size="sm"
                onclick={() => applyPreset('ontem')}
              >
                Ontem
              </Button>
              <Button
                variant={activePreset === '7dias' ? 'primary' : 'ghost'}
                size="sm"
                onclick={() => applyPreset('7dias')}
              >
                7 Dias
              </Button>
              <Button
                variant={activePreset === '30dias' ? 'primary' : 'ghost'}
                size="sm"
                onclick={() => applyPreset('30dias')}
              >
                30 Dias
              </Button>
              <Button
                variant={activePreset === 'mes' ? 'primary' : 'ghost'}
                size="sm"
                onclick={() => applyPreset('mes')}
              >
                Mês Atual
              </Button>
            </div>
          </div>

          <div class="custom-date-row">
            <div class="date-field">
              <span class="field-label">DATA INÍCIO</span>
              <input
                type="date"
                class="date-input"
                bind:value={dataInicio}
                onchange={() => {
                  activePreset = 'tudo'
                  loadReport()
                }}
              />
            </div>
            <div class="date-field">
              <span class="field-label">DATA FIM</span>
              <input
                type="date"
                class="date-input"
                bind:value={dataFim}
                onchange={() => {
                  activePreset = 'tudo'
                  loadReport()
                }}
              />
            </div>
            <div class="search-field">
              <span class="field-label">BUSCAR TECIDO / COR</span>
              <Input
                bind:value={searchTerm}
                placeholder="Filtrar por nome ou código..."
              />
            </div>
          </div>
        </div>
      </Panel>

      <!-- KPIs Consolidados do Período -->
      <Panel title="Resumo do Período Selecionado">
        <div class="metrics-grid">
          <div class="metric-cell">
            <Metric
              label="Faturamento do Período"
              value={relatorio?.kpis ? `R$ ${formatCurrency(relatorio.kpis.faturamentoTotal)}` : 'R$ 0,00'}
            />
          </div>
          <div class="metric-cell">
            <Metric
              label="Metragem Total"
              value={relatorio?.kpis ? formatCurrency(relatorio.kpis.quantidadeTotalMetros) : '0,00'}
              unit="m"
            />
          </div>
          <div class="metric-cell">
            <Metric
              label="Total de Vendas"
              value={relatorio?.kpis ? String(relatorio.kpis.totalVendas) : '0'}
              unit="ped"
            />
          </div>
          <div class="metric-cell">
            <Metric
              label="Ticket Médio / Venda"
              value={relatorio?.kpis ? `R$ ${formatCurrency(relatorio.kpis.ticketMedioVenda)}` : 'R$ 0,00'}
            />
          </div>
          <div class="metric-cell">
            <Metric
              label="Preço Médio / Metro"
              value={relatorio?.kpis ? `R$ ${formatCurrency(relatorio.kpis.precoMedioMetro)}` : 'R$ 0,00'}
            />
          </div>
        </div>
      </Panel>

      <!-- Tabela Hierárquica Analítica -->
      <Panel title="Discriminação Analítica por Tecido e Cores">
        {#if isLoading}
          <div class="table-empty">
            <Badge text="CARREGANDO DADOS ANALÍTICOS..." tone="warn" />
          </div>
        {:else if errorMsg}
          <EmptyState title="Erro ao carregar relatório" description={errorMsg} />
        {:else if filteredTecidos.length === 0}
          <EmptyState
            title="Nenhuma venda encontrada"
            description="Não foram encontrados registros de venda para os filtros e período informados."
          />
        {:else}
          <div class="tree-table-wrapper">
            <table class="tree-table">
              <thead>
                <tr>
                  <th class="th-expand"></th>
                  <th class="th-sku">SKU / CÓD</th>
                  <th class="th-desc">TECIDO / COR</th>
                  <th class="th-num">QTD (METROS)</th>
                  <th class="th-num">PREÇO MÉDIO</th>
                  <th class="th-num">SUBTOTAL (R$)</th>
                  <th class="th-pct">PARTICIPAÇÃO</th>
                </tr>
              </thead>
              <tbody>
                {#each filteredTecidos as tecido}
                  {@const isExpanded = !!expandedTecidos[tecido.tecidoId]}
                  <!-- Linha Pai (Tecido) -->
                  <tr class="tr-tecido" onclick={() => toggleTecido(tecido.tecidoId)}>
                    <td class="td-expand">
                      <button class="expand-btn" aria-label="Expandir ou recolher tecido">
                        {isExpanded ? '▼' : '▶'}
                      </button>
                    </td>
                    <td class="td-sku font-mono">{tecido.tecidoCodigo}</td>
                    <td class="td-desc">
                      <span class="tecido-nome">{tecido.tecidoNome}</span>
                      <span class="cores-count font-mono">({tecido.cores.length} {tecido.cores.length === 1 ? 'cor' : 'cores'})</span>
                    </td>
                    <td class="td-num font-mono">{formatCurrency(tecido.quantidadeTotal)} m</td>
                    <td class="td-num font-mono">R$ {formatCurrency(tecido.precoMedio)}</td>
                    <td class="td-num font-mono bold">R$ {formatCurrency(tecido.valorTotal)}</td>
                    <td class="td-pct">
                      <div class="pct-bar-wrap">
                        <div class="pct-track">
                          <div class="pct-fill" style:width="{tecido.percentualGeral}%"></div>
                        </div>
                        <span class="pct-val font-mono">{tecido.percentualGeral.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>

                  <!-- Linhas Filhas (Cores do Tecido) -->
                  {#if isExpanded}
                    {#each tecido.cores as cor}
                      <tr class="tr-cor">
                        <td class="td-expand"></td>
                        <td class="td-sku font-mono text-muted">↳ {cor.corCodigo}</td>
                        <td class="td-desc">
                          <div class="cor-info">
                            {#if cor.corHex}
                              <span class="cor-swatch" style:background={cor.corHex}></span>
                            {/if}
                            <span class="cor-nome">{cor.corNome}</span>
                          </div>
                        </td>
                        <td class="td-num font-mono text-muted">{formatCurrency(cor.quantidadeTotal)} m</td>
                        <td class="td-num font-mono text-muted">R$ {formatCurrency(cor.precoMedio)}</td>
                        <td class="td-num font-mono">R$ {formatCurrency(cor.valorTotal)}</td>
                        <td class="td-pct">
                          <div class="cor-pcts font-mono">
                            <span class="pct-tecido" title="Participação no tecido">{cor.percentualTecido.toFixed(1)}% tec</span>
                            <span class="pct-geral" title="Participação no faturamento geral">({cor.percentualGeral.toFixed(1)}% tot)</span>
                          </div>
                        </td>
                      </tr>
                    {/each}
                  {/if}
                {/each}
              </tbody>
              <tfoot>
                <tr class="tr-total">
                  <td colspan="3" class="td-total-label">TOTAL CONSOLIDADO DO PERÍODO</td>
                  <td class="td-num font-mono bold">
                    {formatCurrency(relatorio?.kpis?.quantidadeTotalMetros || 0)} m
                  </td>
                  <td class="td-num font-mono bold">
                    R$ {formatCurrency(relatorio?.kpis?.precoMedioMetro || 0)}
                  </td>
                  <td class="td-num font-mono bold">
                    R$ {formatCurrency(relatorio?.kpis?.faturamentoTotal || 0)}
                  </td>
                  <td class="td-pct font-mono bold">100.0%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        {/if}
      </Panel>
    </Stack>
  </div>
</div>

<style>
  .report-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    background: var(--color-bg);
  }

  .report-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 40px;
    padding: 0 var(--space-4);
    box-shadow: inset 0 -1px 0 0 var(--color-border);
    background: var(--color-bg-elevated);
    box-sizing: border-box;
    flex-shrink: 0;
  }

  .toolbar-left,
  .toolbar-right {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .divider-v {
    width: 1px;
    height: 16px;
    background: var(--color-border);
    margin: 0 var(--space-1);
  }

  .toolbar-title {
    font-size: var(--text-xs);
    font-family: var(--font-mono);
    letter-spacing: var(--tracking-header);
    color: var(--color-fg);
    line-height: 100%;
  }

  .report-content {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-4);
    box-sizing: border-box;
  }

  /* Filters */
  .filters-container {
    display: flex;
    flex-direction: column;
    padding: var(--space-3);
    gap: var(--space-3);
    box-sizing: border-box;
  }

  .presets-row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    flex-wrap: wrap;
  }

  .filter-label {
    font-size: 10px;
    font-family: var(--font-mono);
    color: var(--color-fg-muted);
    letter-spacing: var(--tracking-label);
    line-height: 100%;
  }

  .presets-buttons {
    display: flex;
    align-items: center;
    gap: var(--space-1);
  }

  .custom-date-row {
    display: grid;
    grid-template-columns: 180px 180px 1fr;
    gap: var(--space-3);
    align-items: flex-end;
  }

  .date-field,
  .search-field {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .field-label {
    font-size: 10px;
    font-family: var(--font-mono);
    color: var(--color-fg-muted);
    letter-spacing: var(--tracking-label);
    line-height: 100%;
  }

  .date-input {
    height: 32px;
    background: var(--color-bg-sunken);
    border: var(--border-width) solid var(--color-border);
    color: var(--color-fg);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    padding: 0 var(--space-2);
    box-sizing: border-box;
    line-height: 100%;
    outline: none;
  }

  .date-input:focus {
    border-color: var(--color-border-strong);
  }

  /* Metrics Grid */
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    background: var(--color-border);
    gap: var(--border-width);
    border: var(--border-width) solid var(--color-border);
    box-sizing: border-box;
  }

  .metric-cell {
    padding: var(--space-3);
    background: var(--color-bg-elevated);
    box-sizing: border-box;
  }

  /* Tree Table */
  .tree-table-wrapper {
    overflow-x: auto;
    border: var(--border-width) solid var(--color-border);
    box-sizing: border-box;
  }

  .tree-table {
    width: 100%;
    border-collapse: collapse;
    font-family: var(--font-sans);
    font-size: var(--text-xs);
    line-height: 100%;
    box-sizing: border-box;
  }

  .tree-table th {
    background: var(--color-bg-sunken);
    color: var(--color-fg-muted);
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: var(--tracking-header);
    text-transform: uppercase;
    height: 36px;
    padding: 0 var(--space-3);
    text-align: left;
    box-shadow: inset 0 -1px 0 0 var(--color-border);
    box-sizing: border-box;
  }

  .tree-table td {
    height: 36px;
    padding: 0 var(--space-3);
    box-sizing: border-box;
    line-height: 100%;
  }

  .th-expand { width: 32px; }
  .th-sku { width: 110px; }
  .th-desc { min-width: 220px; }
  .th-num { width: 140px; text-align: right !important; }
  .th-pct { width: 160px; text-align: right !important; }

  .td-num { text-align: right; }
  .td-pct { text-align: right; }

  .tr-tecido {
    background: var(--color-bg-elevated);
    box-shadow: inset 0 -1px 0 0 var(--color-border);
    cursor: pointer;
    user-select: none;
  }

  .tr-tecido:hover {
    background: #1a1a1a;
  }

  .expand-btn {
    background: transparent;
    border: none;
    color: var(--color-fg-muted);
    font-size: 10px;
    cursor: pointer;
    padding: 0;
    line-height: 100%;
  }

  .tecido-nome {
    font-weight: 600;
    color: var(--color-fg);
  }

  .cores-count {
    color: var(--color-fg-dim);
    font-size: 10px;
    margin-left: var(--space-2);
  }

  .pct-bar-wrap {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--space-2);
  }

  .pct-track {
    width: 60px;
    height: 6px;
    background: var(--color-bg-sunken);
    border: var(--border-width) solid var(--color-border);
  }

  .pct-fill {
    height: 100%;
    background: var(--color-accent);
  }

  .pct-val {
    font-size: 11px;
    color: var(--color-fg);
    min-width: 38px;
    text-align: right;
  }

  /* Tr Cor (Filho) */
  .tr-cor {
    background: var(--color-bg);
    box-shadow: inset 0 -1px 0 0 var(--color-border);
  }

  .tr-cor:hover {
    background: var(--color-bg-elevated);
  }

  .cor-info {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .cor-swatch {
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 1px solid var(--color-border-strong);
    box-sizing: border-box;
    flex-shrink: 0;
  }

  .cor-nome {
    color: var(--color-fg);
  }

  .cor-pcts {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--space-1);
    font-size: 11px;
  }

  .pct-tecido {
    color: var(--color-fg-muted);
  }

  .pct-geral {
    color: var(--color-fg-dim);
  }

  /* Footer */
  .tr-total {
    background: var(--color-bg-sunken);
    box-shadow: inset 0 2px 0 0 var(--color-border-strong);
  }

  .td-total-label {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: var(--tracking-label);
    color: var(--color-fg-muted);
  }

  .bold {
    font-weight: 700;
    color: var(--color-fg);
  }

  .font-mono {
    font-family: var(--font-mono);
  }

  .text-muted {
    color: var(--color-fg-muted);
  }

  .table-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 120px;
  }
</style>
