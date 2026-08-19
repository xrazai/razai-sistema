<script lang="ts">
  export type BarChartItem = {
    label: string
    value: number
    secondaryValue?: number
    secondaryLabel?: string
    helper?: string
    active?: boolean
  }

  type Props = {
    items: BarChartItem[]
    title?: string
    orientation?: 'vertical' | 'horizontal'
    height?: string
    valueFormatter?: (val: number) => string
    showValues?: boolean
  }

  let {
    items = [],
    title = '',
    orientation = 'vertical',
    height = '140px',
    valueFormatter = (val) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    showValues = true
  }: Props = $props()

  const maxValue = $derived.by(() => {
    if (items.length === 0) return 1
    const max = Math.max(...items.map((i) => i.value), 0)
    return max > 0 ? max : 1
  })

  // Helper para gerar barra de caracteres ASCII/Bloco
  function getAsciiBar(pct: number, length = 18): string {
    const filled = Math.round((pct / 100) * length)
    const blocks = '█'.repeat(filled)
    const empty = '░'.repeat(Math.max(0, length - filled))
    return blocks + empty
  }
</script>

<div class="chart-container" class:horizontal={orientation === 'horizontal'} class:vertical={orientation === 'vertical'}>
  {#if title}
    <div class="chart-header">
      <span class="title-text">{title}</span>
      <span class="max-badge">MAX: {valueFormatter(maxValue)}</span>
    </div>
  {/if}

  {#if items.length === 0}
    <div class="empty-chart">
      <span>NENHUM DADO REGISTRADO</span>
    </div>
  {:else if orientation === 'vertical'}
    <div class="vertical-chart" style:height={height}>
      <div class="columns-wrap">
        {#each items as item}
          {@const pct = Math.max(0, Math.min(100, (item.value / maxValue) * 100))}
          <div class="col-item" class:active={item.active} class:zero={item.value === 0}>
            {#if showValues}
              <div class="value-tip" title={valueFormatter(item.value)}>
                {item.value > 0 ? valueFormatter(item.value) : '—'}
              </div>
            {/if}
            <div class="bar-track">
              <div class="bar-fill" style:height="{pct}%">
                {#if pct > 0}
                  <div class="bar-cap"></div>
                {/if}
              </div>
            </div>
            <div class="axis-label" title={item.label}>
              {item.label}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {:else}
    <div class="horizontal-chart">
      {#each items as item}
        {@const pct = Math.max(0, Math.min(100, (item.value / maxValue) * 100))}
        <div class="h-row" class:active={item.active}>
          <div class="h-label" title={item.label}>
            <span>{item.label}</span>
          </div>
          <div class="h-bar-cell">
            <div class="h-bar-track">
              <div class="h-bar-fill" style:width="{pct}%"></div>
            </div>
            <span class="h-ascii-bar" aria-hidden="true">
              {getAsciiBar(pct, 14)}
            </span>
          </div>
          {#if showValues}
            <div class="h-value numeric">
              {valueFormatter(item.value)}
              {#if item.secondaryLabel}
                <span class="h-secondary">{item.secondaryLabel}</span>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .chart-container {
    display: flex;
    flex-direction: column;
    background: var(--color-bg-elevated);
    border: var(--border-width) solid var(--color-border);
    box-sizing: border-box;
    width: 100%;
  }

  .chart-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 32px;
    padding: 0 var(--space-3);
    box-shadow: inset 0 -1px 0 0 var(--color-border);
    background: var(--color-bg-sunken);
    box-sizing: border-box;
  }

  .title-text {
    font-size: var(--text-xs);
    font-family: var(--font-mono);
    text-transform: uppercase;
    letter-spacing: var(--tracking-header);
    color: var(--color-fg-muted);
    line-height: 100%;
  }

  .max-badge {
    font-size: var(--text-xs);
    font-family: var(--font-mono);
    color: var(--color-fg-dim);
    line-height: 100%;
  }

  .empty-chart {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 120px;
    font-size: var(--text-xs);
    font-family: var(--font-mono);
    color: var(--color-fg-dim);
    letter-spacing: var(--tracking-label);
  }

  /* Vertical Chart */
  .vertical-chart {
    display: flex;
    flex-direction: column;
    padding: var(--space-3);
    box-sizing: border-box;
    width: 100%;
  }

  .columns-wrap {
    display: flex;
    align-items: flex-end;
    gap: var(--space-2);
    height: 100%;
    width: 100%;
  }

  .col-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    height: 100%;
    min-width: 0;
    gap: var(--space-1);
  }

  .value-tip {
    font-size: 10px;
    font-family: var(--font-mono);
    color: var(--color-fg-muted);
    line-height: 100%;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
    height: 12px;
  }

  .col-item.active .value-tip {
    color: var(--color-fg);
    font-weight: 600;
  }

  .bar-track {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    flex: 1;
    width: 100%;
    max-width: 36px;
    background: var(--color-bg-sunken);
    border: var(--border-width) solid var(--color-border);
    box-sizing: border-box;
  }

  .bar-fill {
    position: relative;
    width: 100%;
    background: var(--color-fg-dim);
    min-height: 0;
    transition: height var(--motion-fast);
  }

  .col-item:hover .bar-fill,
  .col-item.active .bar-fill {
    background: var(--color-accent);
  }

  .bar-cap {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--color-fg);
  }

  .axis-label {
    font-size: var(--text-xs);
    font-family: var(--font-mono);
    color: var(--color-fg-muted);
    line-height: 100%;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .col-item.active .axis-label {
    color: var(--color-fg);
  }

  /* Horizontal Chart */
  .horizontal-chart {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
  }

  .h-row {
    display: grid;
    grid-template-columns: 140px 1fr 120px;
    align-items: center;
    height: 32px;
    padding: 0 var(--space-3);
    box-shadow: inset 0 -1px 0 0 var(--color-border);
    box-sizing: border-box;
    gap: var(--space-3);
  }

  .h-row:last-child {
    box-shadow: none;
  }

  .h-label {
    font-size: var(--text-xs);
    font-family: var(--font-mono);
    color: var(--color-fg);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 100%;
  }

  .h-bar-cell {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-width: 0;
  }

  .h-bar-track {
    flex: 1;
    height: 8px;
    background: var(--color-bg-sunken);
    border: var(--border-width) solid var(--color-border);
    box-sizing: border-box;
  }

  .h-bar-fill {
    height: 100%;
    background: var(--color-fg-dim);
    transition: width var(--motion-fast);
  }

  .h-row:hover .h-bar-fill,
  .h-row.active .h-bar-fill {
    background: var(--color-accent);
  }

  .h-ascii-bar {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--color-fg-dim);
    line-height: 100%;
    letter-spacing: -0.05em;
    user-select: none;
  }

  .h-value {
    font-size: var(--text-xs);
    font-family: var(--font-mono);
    color: var(--color-fg);
    text-align: right;
    line-height: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--space-1);
  }

  .h-secondary {
    font-size: 10px;
    color: var(--color-fg-muted);
  }
</style>
