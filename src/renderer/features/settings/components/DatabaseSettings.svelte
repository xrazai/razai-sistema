<script lang="ts">
  import { onMount } from 'svelte'
  import Inspector from '../../../design-system/compositions/Inspector.svelte'
  import Stack from '../../../design-system/layout/Stack.svelte'
  import Label from '../../../design-system/primitives/Label.svelte'
  import Status from '../../../design-system/data-display/Status.svelte'
  import Button from '../../../design-system/controls/Button.svelte'
  import Badge from '../../../design-system/data-display/Badge.svelte'
  import Icon from '../../../design-system/primitives/Icon.svelte'
  import Divider from '../../../design-system/primitives/Divider.svelte'
  import type { DbHealth } from '../../../../shared/types'

  let dbHealth = $state<DbHealth | null>(null)
  let isLoading = $state(true)
  let actionMessage = $state<string | null>(null)
  let actionTone = $state<'ok' | 'danger' | 'info'>('info')
  let isExporting = $state(false)

  async function refreshHealth() {
    isLoading = true
    try {
      if (typeof window !== 'undefined' && window.razai?.getDbHealth) {
        dbHealth = await window.razai.getDbHealth()
      } else {
        dbHealth = { ok: false, schemaVersion: 'browser', error: 'Modo navegador (window.razai indisponível)' }
      }
    } catch (err: any) {
      dbHealth = { ok: false, schemaVersion: 'none', error: err?.message || 'Erro ao chamar IPC db:health' }
    } finally {
      isLoading = false
    }
  }

  async function handleExportTecidos() {
    isExporting = true
    actionMessage = null
    try {
      if (typeof window !== 'undefined' && window.razai?.backup) {
        const res = await window.razai.backup.exportTecidosCsv()
        if (res.ok && res.filePath) {
          actionTone = 'ok'
          actionMessage = `CSV de Tecidos exportado com sucesso em: ${res.filePath}`
        } else if (res.canceled) {
          actionMessage = null
        } else {
          actionTone = 'danger'
          actionMessage = res.error || 'Falha ao exportar CSV de Tecidos'
        }
      }
    } catch (err: any) {
      actionTone = 'danger'
      actionMessage = err?.message || 'Erro ao exportar Tecidos'
    } finally {
      isExporting = false
    }
  }

  async function handleExportCores() {
    isExporting = true
    actionMessage = null
    try {
      if (typeof window !== 'undefined' && window.razai?.backup) {
        const res = await window.razai.backup.exportCoresCsv()
        if (res.ok && res.filePath) {
          actionTone = 'ok'
          actionMessage = `CSV de Cores exportado com sucesso em: ${res.filePath}`
        } else if (res.canceled) {
          actionMessage = null
        } else {
          actionTone = 'danger'
          actionMessage = res.error || 'Falha ao exportar CSV de Cores'
        }
      }
    } catch (err: any) {
      actionTone = 'danger'
      actionMessage = err?.message || 'Erro ao exportar Cores'
    } finally {
      isExporting = false
    }
  }

  async function handleExportDatabase() {
    isExporting = true
    actionMessage = null
    try {
      if (typeof window !== 'undefined' && window.razai?.backup) {
        const res = await window.razai.backup.exportDatabase()
        if (res.ok && res.filePath) {
          actionTone = 'ok'
          actionMessage = `Backup do SQLite salvo com sucesso em: ${res.filePath}`
        } else if (res.canceled) {
          actionMessage = null
        } else {
          actionTone = 'danger'
          actionMessage = res.error || 'Falha ao realizar backup do banco SQLite'
        }
      }
    } catch (err: any) {
      actionTone = 'danger'
      actionMessage = err?.message || 'Erro ao fazer backup do SQLite'
    } finally {
      isExporting = false
    }
  }

  onMount(() => {
    refreshHealth()
  })
</script>

<Inspector title="Banco de Dados (SQLite)">
  <Stack gap="3">
    <div class="field-item">
      <Label text="Status da Conexão" />
      <div class="status-row">
        <Status
          label={dbHealth?.ok ? 'CONECTADO (ONLINE)' : 'ERRO DE CONEXÃO'}
          tone={dbHealth?.ok ? 'ok' : 'danger'}
        />
        <Button variant="ghost" size="sm" onclick={refreshHealth} disabled={isLoading}>
          <Icon name="search" size="sm" />
          <span>{isLoading ? 'Testando...' : 'Testar Conexão'}</span>
        </Button>
      </div>
    </div>

    <div class="field-item">
      <Label text="Versão do Schema / Migrations" />
      <div class="value numeric">{dbHealth?.schemaVersion ? `v${dbHealth.schemaVersion}` : '—'}</div>
    </div>

    {#if dbHealth?.timestamp}
      <div class="field-item">
        <Label text="Última Checagem" />
        <div class="caption">{new Date(dbHealth.timestamp).toLocaleTimeString('pt-BR')}</div>
      </div>
    {/if}

    {#if dbHealth?.error}
      <div class="field-item error-box">
        <Label text="Detalhes da Falha" />
        <Badge text={dbHealth.error} tone="danger" />
      </div>
    {/if}

    <Divider />

    <div class="field-item">
      <Label text="Exportação e Backup" />
      <span class="caption">Exporte tabelas em CSV (UTF-8 BOM para Excel) ou realize cópia segura do banco.</span>
      <div class="actions-stack">
        <Button variant="secondary" size="sm" onclick={handleExportTecidos} disabled={isExporting}>
          <Icon name="fabric" size="sm" />
          <span>Exportar Tecidos (CSV)</span>
        </Button>
        <Button variant="secondary" size="sm" onclick={handleExportCores} disabled={isExporting}>
          <Icon name="palette" size="sm" />
          <span>Exportar Cores (CSV)</span>
        </Button>
        <Button variant="primary" size="sm" onclick={handleExportDatabase} disabled={isExporting}>
          <Icon name="copy" size="sm" />
          <span>Fazer Backup do Banco (SQLite)</span>
        </Button>
      </div>
    </div>

    {#if actionMessage}
      <div class="field-item">
        <Badge text={actionMessage} tone={actionTone} />
      </div>
    {/if}
  </Stack>
</Inspector>

<style>
  .field-item {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .status-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
  }

  .value {
    font-size: var(--text-md);
    color: var(--color-fg);
    font-family: var(--font-mono);
    line-height: 100%;
  }

  .caption {
    font-size: var(--text-xs);
    color: var(--color-fg-muted);
    font-family: var(--font-mono);
    line-height: 100%;
  }

  .error-box {
    margin-top: var(--space-2);
  }

  .actions-stack {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    margin-top: var(--space-2);
  }
</style>
