<script lang="ts">
  import Sidebar from '../design-system/navigation/Sidebar.svelte'
  import NavItem from '../design-system/navigation/NavItem.svelte'
  import type { Route } from './router.svelte'

  type Props = {
    route: Route
    onnavigate: (route: Route) => void
  }

  let { route, onnavigate }: Props = $props()
</script>

<Sidebar>
  <div class="brand">RAZAI / SISTEMA</div>
  <NavItem
    label="Início"
    icon="dash"
    active={route === 'dashboard'}
    onclick={() => onnavigate('dashboard')}
  />
  <NavItem
    label="Vendas"
    icon="cart"
    active={route === 'vendas'}
    onclick={() => onnavigate('vendas')}
  />
  <NavItem
    label="Pedidos"
    icon="orders"
    active={route === 'pedidos'}
    onclick={() => onnavigate('pedidos')}
  />
  <NavItem
    label="Relatórios"
    icon="reports"
    active={route === 'relatorios'}
    onclick={() => onnavigate('relatorios')}
  />
  <NavItem
    label="Tecidos"
    icon="fabric"
    active={route === 'tecidos'}
    onclick={() => onnavigate('tecidos')}
  />
  <NavItem
    label="Cores"
    icon="palette"
    active={route === 'cores'}
    onclick={() => onnavigate('cores')}
  />
  <NavItem
    label="Vínculos"
    icon="link"
    active={route === 'vinculos'}
    onclick={() => onnavigate('vinculos')}
  />
  <NavItem
    label="Settings"
    icon="settings"
    active={route === 'settings'}
    onclick={() => onnavigate('settings')}
  />
  <NavItem
    label="Design System"
    icon="grid"
    active={route === 'design-system'}
    onclick={() => onnavigate('design-system')}
  />
</Sidebar>

<style>
  .brand {
    display: flex;
    align-items: center;
    height: 40px;
    padding: var(--space-2) var(--space-3);
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-header);
    text-transform: uppercase;
    color: var(--color-fg);
    line-height: 100%;
    box-shadow: inset 0 -1px 0 0 var(--color-border);
    box-sizing: border-box;
  }
</style>
