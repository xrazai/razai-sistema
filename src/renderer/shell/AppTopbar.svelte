<script lang="ts">
  import { onMount } from 'svelte'
  import Topbar from '../design-system/navigation/Topbar.svelte'
  import Status from '../design-system/data-display/Status.svelte'
  import Icon from '../design-system/primitives/Icon.svelte'
  import Button from '../design-system/controls/Button.svelte'
  import { router, type Route } from './router.svelte'
  import type { DbHealth } from '../../shared/types'

  type Props = {
    route: Route
  }

  let { route }: Props = $props()

  const titles: Record<Route, string> = {
    dashboard: 'Início',
    vendas: 'Vendas',
    pedidos: 'Pedidos',
    relatorios: 'Relatórios',
    tecidos: 'Tecidos',
    cores: 'Cores',
    vinculos: 'Vínculos',
    settings: 'Settings',
    'design-system': 'Design System'
  }

  let displayTitle = $derived.by(() => {
    if (router.route === 'vendas') {
      if (router.subRoute === 'novo') return 'Vendas / Novo Lançamento'
      if (router.subRoute.startsWith('confirmacao')) return 'Vendas / Comprovante'
      return 'Vendas'
    }
    if (router.route === 'pedidos') {
      if (router.subRoute === 'novo') return 'Pedidos / Novo Lançamento'
      if (router.subRoute) return 'Pedidos / Detalhes'
      return 'Pedidos'
    }
    if (router.route === 'relatorios') {
      if (router.subRoute === 'vendas-tecido-cor') return 'Relatórios / Vendas por Tecido e Cor'
      if (router.subRoute === 'previsibilidade-estoque') return 'Relatórios / Previsibilidade de Demanda'
      return 'Relatórios'
    }
    if (router.route === 'tecidos') {
      if (router.subRoute === 'cadastro') return 'Tecidos / Cadastro'
      if (router.subRoute) return 'Tecidos / Detalhes'
      return 'Tecidos'
    }
    if (router.route === 'cores') {
      if (router.subRoute === 'cadastro') return 'Cores / Cadastro'
      if (router.subRoute) return 'Cores / Detalhes'
      return 'Cores'
    }
    if (router.route === 'vinculos') {
      if (router.subRoute === 'cadastro') return 'Vínculos / Cadastro'
      if (router.subRoute) return 'Vínculos / Detalhes'
      return 'Vínculos'
    }
    return titles[route] || 'Razai Sistema'
  })

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

<Topbar title={displayTitle}>
  <div class="topbar-actions">
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

    {#if router.route === 'vendas' && !router.subRoute}
      <Button variant="primary" size="sm" onclick={() => router.navigate('vendas/novo')}>
        <Icon name="plus" size="sm" />
        <span>Registrar Venda</span>
      </Button>
    {:else if router.route === 'vendas' && router.subRoute}
      <Button variant="ghost" size="sm" onclick={() => router.navigate('vendas')}>
        <Icon name="arrow-left" size="sm" />
        <span>Voltar</span>
      </Button>
    {:else if router.route === 'pedidos' && !router.subRoute}
      <Button variant="primary" size="sm" onclick={() => router.navigate('pedidos/novo')}>
        <Icon name="plus" size="sm" />
        <span>Novo Pedido</span>
      </Button>
    {:else if router.route === 'pedidos' && router.subRoute}
      <Button variant="ghost" size="sm" onclick={() => router.navigate('pedidos')}>
        <Icon name="arrow-left" size="sm" />
        <span>Voltar</span>
      </Button>
    {:else if router.route === 'tecidos' && !router.subRoute}
      <Button variant="primary" size="sm" onclick={() => router.navigate('tecidos/cadastro')}>
        <Icon name="plus" size="sm" />
        <span>Cadastrar Tecido</span>
      </Button>
    {:else if router.route === 'tecidos' && router.subRoute}
      <Button variant="ghost" size="sm" onclick={() => router.navigate('tecidos')}>
        <Icon name="arrow-left" size="sm" />
        <span>Voltar</span>
      </Button>
    {:else if router.route === 'cores' && !router.subRoute}
      <Button variant="primary" size="sm" onclick={() => router.navigate('cores/cadastro')}>
        <Icon name="plus" size="sm" />
        <span>Cadastrar Cor</span>
      </Button>
    {:else if router.route === 'cores' && router.subRoute}
      <Button variant="ghost" size="sm" onclick={() => router.navigate('cores')}>
        <Icon name="arrow-left" size="sm" />
        <span>Voltar</span>
      </Button>
    {:else if router.route === 'vinculos' && !router.subRoute}
      <Button variant="primary" size="sm" onclick={() => router.navigate('vinculos/cadastro')}>
        <Icon name="plus" size="sm" />
        <span>Cadastrar Vínculo</span>
      </Button>
    {:else if router.route === 'vinculos' && router.subRoute}
      <Button variant="ghost" size="sm" onclick={() => router.navigate('vinculos')}>
        <Icon name="arrow-left" size="sm" />
        <span>Voltar</span>
      </Button>
    {/if}
  </div>
</Topbar>

<style>
  .topbar-actions {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

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
