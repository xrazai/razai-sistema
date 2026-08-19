<script lang="ts">
  import Stack from '../../../design-system/layout/Stack.svelte'
  import Grid from '../../../design-system/layout/Grid.svelte'
  import Panel from '../../../design-system/layout/Panel.svelte'
  import Metric from '../../../design-system/data-display/Metric.svelte'
  import AsciiBarChart, { type BarChartItem } from '../../../design-system/data-display/AsciiBarChart.svelte'
  import Button from '../../../design-system/controls/Button.svelte'
  import Icon from '../../../design-system/primitives/Icon.svelte'
  import Badge from '../../../design-system/data-display/Badge.svelte'
  import RelatorioCard from './RelatorioCard.svelte'
  import { router } from '../../../shell/router.svelte'
  import type { RelatorioKpis, VendaDiariaItem } from '../../../../shared/types'

  type Props = {
    kpis: RelatorioKpis | null
    vendas7Dias: VendaDiariaItem[]
    isLoading: boolean
    onrefresh: () => void
  }

  let { kpis, vendas7Dias = [], isLoading, onrefresh }: Props = $props()

  const chartItems = $derived.by<BarChartItem[]>(() => {
    const todayStr = new Date().toISOString().substring(0, 10)
    return vendas7Dias.map((d) => ({
      label: d.label,
      value: d.valorTotal,
      secondaryLabel: `${d.vendasCount} vendas`,
      active: d.data === todayStr
    }))
  })

  const totalSemana = $derived.by(() => {
    return vendas7Dias.reduce((acc, d) => acc + d.valorTotal, 0)
  })

  const totalMetrosSemana = $derived.by(() => {
    return vendas7Dias.reduce((acc, d) => acc + d.quantidadeTotal, 0)
  })

  const totalVendasSemana = $derived.by(() => {
    return vendas7Dias.reduce((acc, d) => acc + d.vendasCount, 0)
  })

  function formatCurrency(val: number): string {
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
</script>

<div class="hub-container">
  <!-- Toolbar / Cabeçalho de Módulo -->
  <div class="hub-toolbar">
    <div class="toolbar-title">
      <Icon name="reports" />
      <span class="title-text">RELATÓRIOS / HUB DE INTELIGÊNCIA</span>
    </div>
    <div class="toolbar-actions">
      <Badge text={isLoading ? 'CARREGANDO...' : 'DADOS ATUALIZADOS'} tone={isLoading ? 'warn' : 'ok'} />
      <Button variant="ghost" size="sm" onclick={onrefresh} disabled={isLoading}>
        <Icon name="check" size="sm" />
        <span>Atualizar</span>
      </Button>
    </div>
  </div>

  <div class="hub-content">
    <Stack gap="4">
      <!-- Seção 1: KPIs Globais Consolidados -->
      <Panel title="Indicadores Gerais de Desempenho (Acumulado)">
        <div class="metrics-grid">
          <div class="metric-cell">
            <Metric
              label="Faturamento Total"
              value={kpis ? `R$ ${formatCurrency(kpis.faturamentoTotal)}` : 'R$ 0,00'}
            />
          </div>
          <div class="metric-cell">
            <Metric
              label="Metragem Vendida"
              value={kpis ? formatCurrency(kpis.quantidadeTotalMetros) : '0,00'}
              unit="m"
            />
          </div>
          <div class="metric-cell">
            <Metric
              label="Vendas Realizadas"
              value={kpis ? String(kpis.totalVendas) : '0'}
              unit="ped"
            />
          </div>
          <div class="metric-cell">
            <Metric
              label="Ticket Médio"
              value={kpis ? `R$ ${formatCurrency(kpis.ticketMedioVenda)}` : 'R$ 0,00'}
            />
          </div>
          <div class="metric-cell">
            <Metric
              label="Preço Médio / Metro"
              value={kpis ? `R$ ${formatCurrency(kpis.precoMedioMetro)}` : 'R$ 0,00'}
            />
          </div>
        </div>
      </Panel>

      <!-- Seção 2: Gráfico dos Últimos 7 Dias e Resumo Semanal -->
      <Panel title="Desempenho dos Últimos 7 Dias (Histórico Diário)">
        <div class="chart-panel-grid">
          <div class="chart-col">
            <AsciiBarChart
              items={chartItems}
              height="150px"
              valueFormatter={(v) => `R$ ${formatCurrency(v)}`}
            />
          </div>
          <div class="summary-col">
            <div class="summary-box">
              <span class="summary-label">TOTAL FATURADO (7 DIAS)</span>
              <span class="summary-val numeric">R$ {formatCurrency(totalSemana)}</span>
            </div>
            <div class="summary-box">
              <span class="summary-label">METRAGEM TOTAL (7 DIAS)</span>
              <span class="summary-val numeric">{formatCurrency(totalMetrosSemana)} m</span>
            </div>
            <div class="summary-box">
              <span class="summary-label">VENDAS EFETUADAS</span>
              <span class="summary-val numeric">{totalVendasSemana} transações</span>
            </div>
          </div>
        </div>
      </Panel>

      <!-- Seção 3: Relatórios Analíticos Disponíveis -->
      <Panel title="Relatórios Analíticos & Inteligência de Estoque">
        <Grid cols={2}>
          <RelatorioCard
            code="REL-01"
            title="Vendas por Tecido e Cor"
            description="Relatório analítico com quebra hierárquica por tecido e cor, cálculo de volume em metros, subtotais e participação percentual nas vendas."
            badge="ANALÍTICO"
            badgeTone="ok"
            actionLabel="Acessar Relatório"
            onclick={() => router.navigate('#relatorios/vendas-tecido-cor')}
          />

          <RelatorioCard
            code="REL-02"
            title="Previsibilidade de Demanda e Estoque"
            description="Forecasting de consumo e reposição de estoque via algoritmo Croston-SBA, classificação de giro por Curva ABC e conversão em rolos de 50m."
            badge="PREVISÃO"
            badgeTone="info"
            actionLabel="Acessar Previsão"
            onclick={() => router.navigate('#relatorios/previsibilidade-estoque')}
          />
        </Grid>
      </Panel>
    </Stack>
  </div>
</div>

<style>
  .hub-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    background: var(--color-bg);
  }

  .hub-toolbar {
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

  .toolbar-title {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .title-text {
    font-size: var(--text-xs);
    font-family: var(--font-mono);
    letter-spacing: var(--tracking-header);
    color: var(--color-fg);
    line-height: 100%;
  }

  .toolbar-actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .hub-content {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-4);
    box-sizing: border-box;
  }

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

  .chart-panel-grid {
    display: grid;
    grid-template-columns: 1fr 220px;
    gap: var(--space-4);
    padding: var(--space-3);
    box-sizing: border-box;
  }

  .chart-col {
    min-width: 0;
  }

  .summary-col {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    justify-content: center;
  }

  .summary-box {
    display: flex;
    flex-direction: column;
    padding: var(--space-2) var(--space-3);
    background: var(--color-bg-sunken);
    border: var(--border-width) solid var(--color-border);
    gap: var(--space-1);
  }

  .summary-label {
    font-size: 10px;
    font-family: var(--font-mono);
    letter-spacing: var(--tracking-label);
    color: var(--color-fg-muted);
    line-height: 100%;
  }

  .summary-val {
    font-size: var(--text-sm);
    font-family: var(--font-mono);
    color: var(--color-fg);
    font-weight: 600;
    line-height: 100%;
  }
</style>
