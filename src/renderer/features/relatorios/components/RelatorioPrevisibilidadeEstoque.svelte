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
  import type {
    RelatorioPrevisibilidadeResult,
    PrevisibilidadeHorizonte,
    PrevisibilidadeItem
  } from '../../../../shared/types'

  let horizonte = $state<PrevisibilidadeHorizonte>(30)
  let filtroAbc = $state<'todas' | 'A' | 'B' | 'C'>('todas')
  let filtroTendencia = $state<'todas' | 'alta' | 'estavel' | 'queda'>('todas')
  let searchTerm = $state('')

  let relatorio = $state<RelatorioPrevisibilidadeResult | null>(null)
  let isLoading = $state(true)
  let errorMsg = $state<string | null>(null)

  async function loadData() {
    isLoading = true
    errorMsg = null
    try {
      if (typeof window !== 'undefined' && window.razai?.relatorios) {
        relatorio = await window.razai.relatorios.getPrevisibilidadeEstoque({
          horizonteDias: horizonte,
          curvaAbc: filtroAbc,
          tendencia: filtroTendencia,
          search: searchTerm || undefined
        })
      }
    } catch (err: any) {
      console.error('Erro ao calcular previsibilidade:', err)
      errorMsg = err?.message || 'Falha ao processar motor estatístico de previsão.'
    } finally {
      isLoading = false
    }
  }

  function setHorizonte(h: PrevisibilidadeHorizonte) {
    horizonte = h
    loadData()
  }

  function setFiltroAbc(abc: 'todas' | 'A' | 'B' | 'C') {
    filtroAbc = abc
    loadData()
  }

  function setFiltroTendencia(t: 'todas' | 'alta' | 'estavel' | 'queda') {
    filtroTendencia = t
    loadData()
  }

  function formatCurrency(val: number): string {
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  onMount(() => {
    loadData()
  })
</script>

<div class="forecast-view">
  <!-- Toolbar Superior -->
  <div class="forecast-toolbar">
    <div class="toolbar-left">
      <Button variant="ghost" size="sm" onclick={() => router.navigate('#relatorios')}>
        <Icon name="arrow-left" size="sm" />
        <span>Hub</span>
      </Button>
      <div class="divider-v"></div>
      <Icon name="reports" />
      <span class="toolbar-title">RELATÓRIO / PREVISIBILIDADE DE DEMANDA & ESTOQUE (CROSTON-SBA)</span>
    </div>

    <div class="toolbar-right">
      <Badge text="MOTOR ESTATÍSTICO SBA" tone="ok" />
      <Button variant="primary" size="sm" onclick={loadData} disabled={isLoading}>
        <Icon name="check" size="sm" />
        <span>Recalcular</span>
      </Button>
    </div>
  </div>

  <div class="forecast-content">
    <Stack gap="4">
      <!-- Painel de Simulação e Parâmetros -->
      <Panel title="Parâmetros de Previsão & Filtros de Simulação">
        <div class="params-container">
          <!-- Linha 1: Horizonte de Previsão -->
          <div class="param-row">
            <span class="param-label">HORIZONTE DE DEMANDA:</span>
            <div class="btn-group">
              <Button
                variant={horizonte === 7 ? 'primary' : 'ghost'}
                size="sm"
                onclick={() => setHorizonte(7)}
              >
                7 Dias (Semanal)
              </Button>
              <Button
                variant={horizonte === 15 ? 'primary' : 'ghost'}
                size="sm"
                onclick={() => setHorizonte(15)}
              >
                15 Dias (Quinzenal)
              </Button>
              <Button
                variant={horizonte === 30 ? 'primary' : 'ghost'}
                size="sm"
                onclick={() => setHorizonte(30)}
              >
                30 Dias (Mensal)
              </Button>
              <Button
                variant={horizonte === 60 ? 'primary' : 'ghost'}
                size="sm"
                onclick={() => setHorizonte(60)}
              >
                60 Dias (Bimestral)
              </Button>
            </div>
          </div>

          <!-- Linha 2: Filtros de Segmentação -->
          <div class="param-row wrap">
            <div class="sub-param">
              <span class="param-label">CURVA ABC:</span>
              <div class="btn-group">
                <Button
                  variant={filtroAbc === 'todas' ? 'primary' : 'ghost'}
                  size="sm"
                  onclick={() => setFiltroAbc('todas')}
                >
                  Todas
                </Button>
                <Button
                  variant={filtroAbc === 'A' ? 'primary' : 'ghost'}
                  size="sm"
                  onclick={() => setFiltroAbc('A')}
                >
                  Classe A (80%)
                </Button>
                <Button
                  variant={filtroAbc === 'B' ? 'primary' : 'ghost'}
                  size="sm"
                  onclick={() => setFiltroAbc('B')}
                >
                  Classe B (15%)
                </Button>
                <Button
                  variant={filtroAbc === 'C' ? 'primary' : 'ghost'}
                  size="sm"
                  onclick={() => setFiltroAbc('C')}
                >
                  Classe C (5%)
                </Button>
              </div>
            </div>

            <div class="sub-param">
              <span class="param-label">TENDÊNCIA:</span>
              <div class="btn-group">
                <Button
                  variant={filtroTendencia === 'todas' ? 'primary' : 'ghost'}
                  size="sm"
                  onclick={() => setFiltroTendencia('todas')}
                >
                  Todas
                </Button>
                <Button
                  variant={filtroTendencia === 'alta' ? 'primary' : 'ghost'}
                  size="sm"
                  onclick={() => setFiltroTendencia('alta')}
                >
                  Em Alta (↑)
                </Button>
                <Button
                  variant={filtroTendencia === 'estavel' ? 'primary' : 'ghost'}
                  size="sm"
                  onclick={() => setFiltroTendencia('estavel')}
                >
                  Estável (→)
                </Button>
                <Button
                  variant={filtroTendencia === 'queda' ? 'primary' : 'ghost'}
                  size="sm"
                  onclick={() => setFiltroTendencia('queda')}
                >
                  Em Queda (↓)
                </Button>
              </div>
            </div>

            <div class="search-wrap">
              <span class="param-label">BUSCA:</span>
              <Input
                bind:value={searchTerm}
                placeholder="Filtrar por SKU, tecido ou cor..."
                oninput={() => loadData()}
              />
            </div>
          </div>
        </div>
      </Panel>

      <!-- KPIs Consolidados da Previsão -->
      <Panel title={`Demanda Total Estimada para os Próximos ${horizonte} Dias`}>
        <div class="metrics-grid">
          <div class="metric-cell">
            <Metric
              label="Demanda Prevista"
              value={relatorio?.kpis ? `${formatCurrency(relatorio.kpis.demandaTotalProjetadaMetros)} m` : '0,00 m'}
            />
          </div>
          <div class="metric-cell">
            <Metric
              label="Sugestão de Rolos (50m)"
              value={relatorio?.kpis ? String(relatorio.kpis.demandaTotalProjetadaRolos) : '0'}
              unit="rolos"
            />
          </div>
          <div class="metric-cell">
            <Metric
              label="Valor Estimado de Reposição"
              value={relatorio?.kpis ? `R$ ${formatCurrency(relatorio.kpis.investimentoTotalReposicao)}` : 'R$ 0,00'}
            />
          </div>
          <div class="metric-cell">
            <Metric
              label="Consumo Médio Geral"
              value={relatorio?.kpis ? `${formatCurrency(relatorio.kpis.taxaMediaDiariaGeralMetros)} m/dia` : '0,00 m/dia'}
            />
          </div>
          <div class="metric-cell">
            <Metric
              label="SKUs em Alta Demanda"
              value={relatorio?.kpis ? String(relatorio.kpis.totalSkusEmAlta) : '0'}
              unit="skus"
            />
          </div>
        </div>
      </Panel>

      <!-- Tabela Técnica de Previsibilidade -->
      <Panel title="Tabela de Projeção de Demanda por SKU">
        {#if isLoading}
          <div class="table-empty">
            <Badge text="PROCESSANDO CÁLCULO ESTATÍSTICO CROSTON-SBA..." tone="warn" />
          </div>
        {:else if errorMsg}
          <EmptyState title="Erro no cálculo de previsão" description={errorMsg} />
        {:else if !relatorio?.itens?.length}
          <EmptyState
            title="Nenhum SKU encontrado"
            description="Não há histórico de vendas para gerar a previsão com os filtros selecionados."
          />
        {:else}
          <div class="forecast-table-wrapper">
            <table class="forecast-table">
              <thead>
                <tr>
                  <th class="th-sku">SKU</th>
                  <th class="th-desc">TECIDO / COR</th>
                  <th class="th-abc">ABC</th>
                  <th class="th-num">HISTÓRICO 30D</th>
                  <th class="th-num">INTERVALO</th>
                  <th class="th-num">SAÍDA (M/DIA)</th>
                  <th class="th-trend">TENDÊNCIA</th>
                  <th class="th-forecast">DEMANDA PREVISTA</th>
                  <th class="th-rolos">ROLOS (50M)</th>
                  <th class="th-num">REPOSIÇÃO (R$)</th>
                  <th class="th-conf">CONFIANÇA</th>
                </tr>
              </thead>
              <tbody>
                {#each relatorio.itens as item}
                  <tr class="tr-item">
                    <td class="td-sku font-mono">{item.sku}</td>
                    <td class="td-desc">
                      <div class="prod-cell">
                        {#if item.corHex}
                          <span class="swatch" style:background={item.corHex}></span>
                        {/if}
                        <span class="tecido-txt">{item.tecidoNome}</span>
                        <span class="cor-txt">· {item.corNome}</span>
                      </div>
                    </td>
                    <td class="td-abc">
                      <Badge
                        text={`[${item.curvaAbc}]`}
                        tone={item.curvaAbc === 'A' ? 'ok' : item.curvaAbc === 'B' ? 'info' : 'neutral'}
                      />
                    </td>
                    <td class="td-num font-mono">
                      <span>{formatCurrency(item.totalVendidoMetros)} m</span>
                      <span class="count-tag font-mono">({item.vendasCount}x)</span>
                    </td>
                    <td class="td-num font-mono text-muted">
                      ~{item.intervaloMedioDias.toFixed(1)} d
                    </td>
                    <td class="td-num font-mono">
                      {item.taxaDiariaCroston.toFixed(2)} m/d
                    </td>
                    <td class="td-trend">
                      {#if item.tendencia === 'alta'}
                        <span class="trend-badge trend-up font-mono">↑ +{item.variacaoPercentual.toFixed(0)}%</span>
                      {:else if item.tendencia === 'queda'}
                        <span class="trend-badge trend-down font-mono">↓ {item.variacaoPercentual.toFixed(0)}%</span>
                      {:else}
                        <span class="trend-badge trend-flat font-mono">→ Estável</span>
                      {/if}
                    </td>
                    <td class="td-forecast font-mono bold">
                      <span class="forecast-val">{formatCurrency(item.demandaPrevistaMetros)} m</span>
                    </td>
                    <td class="td-rolos font-mono">
                      <span class="rolos-badge">{item.demandaPrevistaRolos} {item.demandaPrevistaRolos === 1 ? 'rolo' : 'rolos'}</span>
                    </td>
                    <td class="td-num font-mono bold">
                      R$ {formatCurrency(item.valorPrevistoReposicao)}
                    </td>
                    <td class="td-conf">
                      <Badge
                        text={item.confianca === 'alta' ? 'ALTA' : item.confianca === 'media' ? 'MÉDIA' : item.confianca === 'baixa' ? 'BAIXA' : 'PRELIMINAR'}
                        tone={item.confianca === 'alta' ? 'ok' : item.confianca === 'media' ? 'info' : 'neutral'}
                      />
                    </td>
                  </tr>
                {/each}
              </tbody>
              <tfoot>
                <tr class="tr-total">
                  <td colspan="7" class="td-total-label">TOTAL GERAL ESTIMADO PARA O HORIZONTE ({horizonte} DIAS)</td>
                  <td class="td-forecast font-mono bold">
                    {formatCurrency(relatorio.kpis.demandaTotalProjetadaMetros)} m
                  </td>
                  <td class="td-rolos font-mono bold">
                    {relatorio.kpis.demandaTotalProjetadaRolos} rolos
                  </td>
                  <td class="td-num font-mono bold">
                    R$ {formatCurrency(relatorio.kpis.investimentoTotalReposicao)}
                  </td>
                  <td></td>
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
  .forecast-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    background: var(--color-bg);
  }

  .forecast-toolbar {
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

  .forecast-content {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-4);
    box-sizing: border-box;
  }

  /* Parâmetros */
  .params-container {
    display: flex;
    flex-direction: column;
    padding: var(--space-3);
    gap: var(--space-3);
    box-sizing: border-box;
  }

  .param-row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .param-row.wrap {
    flex-wrap: wrap;
    align-items: flex-end;
  }

  .sub-param {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .search-wrap {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    flex: 1;
    min-width: 220px;
  }

  .param-label {
    font-size: 10px;
    font-family: var(--font-mono);
    color: var(--color-fg-muted);
    letter-spacing: var(--tracking-label);
    line-height: 100%;
  }

  .btn-group {
    display: flex;
    align-items: center;
    gap: var(--space-1);
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

  /* Forecast Table */
  .forecast-table-wrapper {
    overflow-x: auto;
    border: var(--border-width) solid var(--color-border);
    box-sizing: border-box;
  }

  .forecast-table {
    width: 100%;
    border-collapse: collapse;
    font-family: var(--font-sans);
    font-size: var(--text-xs);
    line-height: 100%;
    box-sizing: border-box;
  }

  .forecast-table th {
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

  .forecast-table td {
    height: 36px;
    padding: 0 var(--space-3);
    box-sizing: border-box;
    line-height: 100%;
  }

  .th-sku { width: 110px; }
  .th-desc { min-width: 200px; }
  .th-abc { width: 60px; text-align: center !important; }
  .th-num { width: 120px; text-align: right !important; }
  .th-trend { width: 110px; text-align: center !important; }
  .th-forecast { width: 140px; text-align: right !important; background: rgba(200, 200, 200, 0.04); }
  .th-rolos { width: 110px; text-align: center !important; }
  .th-conf { width: 100px; text-align: center !important; }

  .td-abc { text-align: center; }
  .td-num { text-align: right; }
  .td-trend { text-align: center; }
  .td-forecast { text-align: right; background: rgba(200, 200, 200, 0.04); }
  .td-rolos { text-align: center; }
  .td-conf { text-align: center; }

  .tr-item {
    background: var(--color-bg-elevated);
    box-shadow: inset 0 -1px 0 0 var(--color-border);
  }

  .tr-item:hover {
    background: #191919;
  }

  .prod-cell {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .swatch {
    width: 10px;
    height: 10px;
    border: 1px solid var(--color-border-strong);
    box-sizing: border-box;
    flex-shrink: 0;
  }

  .tecido-txt {
    font-weight: 600;
    color: var(--color-fg);
  }

  .cor-txt {
    color: var(--color-fg-muted);
  }

  .count-tag {
    font-size: 10px;
    color: var(--color-fg-dim);
    margin-left: 2px;
  }

  .trend-badge {
    font-size: 10px;
    padding: 2px 4px;
    border-radius: 0;
    border: 1px solid transparent;
  }

  .trend-up {
    color: var(--color-ok);
    border-color: rgba(122, 154, 122, 0.4);
    background: rgba(122, 154, 122, 0.1);
  }

  .trend-down {
    color: var(--color-danger);
    border-color: rgba(176, 112, 112, 0.4);
    background: rgba(176, 112, 112, 0.1);
  }

  .trend-flat {
    color: var(--color-fg-dim);
    border-color: var(--color-border);
  }

  .forecast-val {
    color: var(--color-fg);
    font-size: var(--text-sm);
  }

  .rolos-badge {
    font-size: 11px;
    padding: 2px var(--space-1);
    background: var(--color-bg-sunken);
    border: var(--border-width) solid var(--color-border);
    color: var(--color-fg-muted);
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
