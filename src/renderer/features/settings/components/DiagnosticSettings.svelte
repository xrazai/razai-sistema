<script lang="ts">
  import { onMount } from 'svelte'
  import Inspector from '../../../design-system/compositions/Inspector.svelte'
  import Stack from '../../../design-system/layout/Stack.svelte'
  import Grid from '../../../design-system/layout/Grid.svelte'
  import Cell from '../../../design-system/primitives/Cell.svelte'
  import Label from '../../../design-system/primitives/Label.svelte'
  import Badge from '../../../design-system/data-display/Badge.svelte'
  import Button from '../../../design-system/controls/Button.svelte'
  import Icon from '../../../design-system/primitives/Icon.svelte'
  import Divider from '../../../design-system/primitives/Divider.svelte'
  import type { SystemMetrics } from '../../../../shared/types'

  let metrics = $state<SystemMetrics | null>(null)
  let logs = $state<string[]>([])
  let isLoading = $state(true)
  let copied = $state(false)
  let copyTimeout: ReturnType<typeof setTimeout> | null = null
  let logLimit = $state(150)

  async function loadData() {
    isLoading = true
    try {
      if (typeof window !== 'undefined' && window.razai?.diagnostics) {
        const [m, l] = await Promise.all([
          window.razai.diagnostics.getMetrics(),
          window.razai.diagnostics.getLogs(logLimit)
        ])
        metrics = m
        logs = l
      } else {
        metrics = {
          electronVersion: 'browser',
          nodeVersion: 'browser',
          chromeVersion: 'browser',
          platform: 'web',
          arch: 'wasm',
          memoryRssMb: 0,
          memoryHeapUsedMb: 0,
          memoryHeapTotalMb: 0,
          uptimeSeconds: 0,
          dbPath: 'memória',
          dbSizeBytes: 0,
          dbOk: true
        }
        logs = ['[INFO] Ambiente de teste / navegador (IPC diagnostics simulado)']
      }
    } catch (err: any) {
      console.error('Erro ao carregar diagnósticos:', err)
    } finally {
      isLoading = false
    }
  }

  async function handleClearLogs() {
    if (typeof window !== 'undefined' && window.razai?.diagnostics) {
      await window.razai.diagnostics.clearLogs()
      await loadData()
    }
  }

  async function handleCopyLogs() {
    const text = logs.join('\n')
    try {
      await navigator.clipboard.writeText(text)
      copied = true
      if (copyTimeout) clearTimeout(copyTimeout)
      copyTimeout = setTimeout(() => {
        copied = false
      }, 2000)
    } catch (err) {
      console.error('Erro ao copiar logs:', err)
    }
  }

  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  function formatUptime(seconds: number): string {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h}h ${m}m ${s}s`
  }

  onMount(() => {
    loadData()
  })
</script>

<Inspector title="Diagnóstico e Runtime do Sistema">
  <Stack gap="3">
    <div class="header-actions">
      <span class="caption">Métricas de runtime e registros de eventos do processo Main.</span>
      <Button variant="ghost" size="sm" onclick={loadData} disabled={isLoading}>
        <Icon name="search" size="sm" />
        <span>{isLoading ? 'Atualizando...' : 'Atualizar'}</span>
      </Button>
    </div>

    <!-- Métricas do Sistema -->
    <div class="metrics-grid">
      <Grid cols={3} bare>
        <Cell>
          <div class="metric-item">
            <Label text="Runtime & Versões" />
            <div class="metric-val">Electron {metrics?.electronVersion ?? '—'}</div>
            <div class="metric-sub">Node {metrics?.nodeVersion} · Chrome {metrics?.chromeVersion}</div>
          </div>
        </Cell>
        <Cell>
          <div class="metric-item">
            <Label text="Memória & Uptime" />
            <div class="metric-val">{metrics?.memoryRssMb ?? 0} MB (RSS)</div>
            <div class="metric-sub">Heap: {metrics?.memoryHeapUsedMb} / {metrics?.memoryHeapTotalMb} MB · Uptime: {formatUptime(metrics?.uptimeSeconds ?? 0)}</div>
          </div>
        </Cell>
        <Cell>
          <div class="metric-item">
            <Label text="Banco de Dados SQLite" />
            <div class="metric-val">
              <Badge
                text={metrics?.dbOk ? 'INTEGRIDADE OK' : 'FALHA DE ACESSO'}
                tone={metrics?.dbOk ? 'ok' : 'danger'}
              />
            </div>
            <div class="metric-sub">{formatBytes(metrics?.dbSizeBytes ?? 0)} · {metrics?.platform}-{metrics?.arch}</div>
          </div>
        </Cell>
      </Grid>
    </div>

    <Divider />

    <!-- Visualizador de Logs -->
    <div class="logs-section">
      <div class="logs-toolbar">
        <div class="logs-title">
          <Label text={`Logs do Main (${logs.length} linhas)`} />
        </div>
        <div class="logs-btns">
          <Button variant="ghost" size="sm" onclick={handleClearLogs} disabled={isLoading || logs.length === 0}>
            <span>Limpar Logs</span>
          </Button>
          <Button variant="secondary" size="sm" onclick={handleCopyLogs} disabled={logs.length === 0}>
            <Icon name={copied ? 'check' : 'copy'} size="sm" />
            <span>{copied ? 'Copiado!' : 'Copiar Logs'}</span>
          </Button>
        </div>
      </div>

      <div class="log-viewer">
        {#if logs.length === 0}
          <div class="log-empty">Nenhum registro de log encontrado no arquivo app.log.</div>
        {:else}
          {#each logs as line, index}
            <div
              class="log-line"
              class:error-line={line.includes('[ERROR]')}
              class:warn-line={line.includes('[WARN]')}
            >
              <span class="line-num">{index + 1}</span>
              <span class="line-content">{line}</span>
            </div>
          {/each}
        {/if}
      </div>
    </div>
  </Stack>
</Inspector>

<style>
  .header-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
  }

  .caption {
    font-size: var(--text-xs);
    color: var(--color-fg-muted);
    font-family: var(--font-mono);
    line-height: 100%;
  }

  .metrics-grid {
    border: var(--border-width) solid var(--color-border);
  }

  .metric-item {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    padding: var(--space-2);
  }

  .metric-val {
    font-size: var(--text-md);
    color: var(--color-fg);
    font-family: var(--font-mono);
    font-weight: 500;
    line-height: 100%;
  }

  .metric-sub {
    font-size: var(--text-xs);
    color: var(--color-fg-dim);
    font-family: var(--font-mono);
    line-height: 100%;
    margin-top: 2px;
  }

  .logs-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .logs-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .logs-btns {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .log-viewer {
    height: 240px;
    max-height: 240px;
    background: var(--color-bg-sunken);
    border: var(--border-width) solid var(--color-border);
    overflow-y: auto;
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    box-sizing: border-box;
    padding: var(--space-2);
  }

  .log-empty {
    color: var(--color-fg-dim);
    font-style: italic;
    padding: var(--space-3);
    text-align: center;
  }

  .log-line {
    display: flex;
    gap: var(--space-2);
    line-height: 100%;
    padding: 3px 0;
    color: var(--color-fg-muted);
    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
    white-space: pre-wrap;
    word-break: break-all;
  }

  .log-line.error-line {
    color: var(--color-danger);
    background: rgba(176, 112, 112, 0.08);
  }

  .log-line.warn-line {
    color: var(--color-warn);
  }

  .line-num {
    color: var(--color-fg-dim);
    min-width: 28px;
    user-select: none;
    text-align: right;
  }

  .line-content {
    flex: 1;
  }
</style>
