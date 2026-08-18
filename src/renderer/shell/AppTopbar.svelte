<script lang="ts">
  import { onMount } from 'svelte'
  import Topbar from '../design-system/navigation/Topbar.svelte'
  import Status from '../design-system/data-display/Status.svelte'
  import Icon from '../design-system/primitives/Icon.svelte'
  import type { DbHealth } from '../../shared/types'

  type Route = 'dashboard' | 'tecidos' | 'cores' | 'vinculos' | 'settings' | 'design-system'

  type Props = {
    route: Route
  }

  let { route }: Props = $props()

  const titles: Record<Route, string> = {
    dashboard: 'Início',
    tecidos: 'Tecidos',
    cores: 'Cores',
    vinculos: 'Vínculos',
    settings: 'Settings',
    'design-system': 'Design System'
  }

  let dbHealth = $state<DbHealth | null>(null)
  let isChecking = $state(false)

  async function checkHealth() {
    isChecking = true
    try {
      if (typeof window !== 'undefined' && window.razai?.getDbHealth) {
        dbHealth = await window.razai.getDbHealth()
      } else {
        dbHealth = { ok: false, schemaVersion: 'browser', error: 'Ambiente web (sem IPC Electron)' }
      }
    } catch (err: any) {
      dbHealth = { ok: false, schemaVersion: 'none', error: err?.message || 'Falha de comunicação IPC' }
    } finally {
      isChecking = false
    }
  }

  onMount(() => {
    checkHealth()
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  })
</script>

<Topbar title={titles[route]}>
  <div class="topbar-status" title={dbHealth?.error || (dbHealth?.ok ? `SQLite v${dbHealth.schemaVersion} conectado` : 'Clique para revalidar conexão')}>
    {#if isChecking && !dbHealth}
      <Status label="Conectando..." tone="warn" />
    {:else if dbHealth?.ok}
      <button class="status-btn" onclick={checkHealth} aria-label="Revalidar conexão SQLite">
        <Status label="SQLite Online" tone="ok" />
      </button>
    {:else}
      <button class="status-btn offline" onclick={checkHealth} aria-label="Reconectar banco de dados">
        <Status label="SQLite Offline" tone="danger" />
        <Icon name="search" size="sm" />
      </button>
    {/if}
  </div>
</Topbar>

<style>
  .topbar-status {
    display: flex;
    align-items: center;
  }

  .status-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    background: transparent;
    border: none;
    padding: 2px var(--space-1);
    cursor: pointer;
    font-family: inherit;
    color: inherit;
    transition: opacity var(--motion-fast);
  }

  .status-btn:hover {
    opacity: 0.8;
  }

  .status-btn.offline {
    padding: 2px var(--space-2);
    border: var(--border-width) solid var(--color-danger);
    background: var(--color-bg-sunken);
  }
</style>
