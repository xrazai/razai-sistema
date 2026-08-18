<script lang="ts">
  import { onMount } from 'svelte'
  import Inspector from '../../../design-system/compositions/Inspector.svelte'
  import Stack from '../../../design-system/layout/Stack.svelte'
  import Label from '../../../design-system/primitives/Label.svelte'
  import Status from '../../../design-system/data-display/Status.svelte'
  import Button from '../../../design-system/controls/Button.svelte'
  import Badge from '../../../design-system/data-display/Badge.svelte'
  import Icon from '../../../design-system/primitives/Icon.svelte'
  import type { DbHealth } from '../../../../shared/types'

  let dbHealth = $state<DbHealth | null>(null)
  let isLoading = $state(true)

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
  }

  .caption {
    font-size: var(--text-xs);
    color: var(--color-fg-muted);
    font-family: var(--font-mono);
  }

  .error-box {
    margin-top: var(--space-2);
  }
</style>
