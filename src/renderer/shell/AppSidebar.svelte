<script lang="ts">
  import Sidebar from '../design-system/navigation/Sidebar.svelte'
  import NavItem from '../design-system/navigation/NavItem.svelte'
  import Icon from '../design-system/primitives/Icon.svelte'
  import { router, type Route } from './router.svelte'

  type Props = {
    route: Route
    onnavigate: (route: string) => void
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
    label="Shopee"
    icon="cart"
    active={route === 'shopee'}
    onclick={() => onnavigate('shopee')}
  />
  {#if route === 'shopee'}
    <button
      type="button"
      class="subnav-item"
      class:active={router.subRoute === 'etiquetas'}
      onclick={() => onnavigate('shopee/etiquetas')}
    >
      <span class="subnav-icon"><Icon name="tag" size="sm" /></span>
      <span>Etiquetas</span>
    </button>
  {/if}
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

  .subnav-item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    width: 100%;
    height: 32px;
    min-height: 32px;
    padding: var(--space-2) var(--space-3) var(--space-2) var(--space-7);
    border: none;
    box-shadow: inset 0 -1px 0 0 var(--color-border);
    background: var(--color-bg-sunken);
    color: var(--color-fg-muted);
    font-size: var(--text-xs);
    line-height: 100%;
    letter-spacing: var(--tracking-tight);
    text-align: left;
    text-transform: uppercase;
    box-sizing: border-box;
  }

  .subnav-item:hover {
    color: var(--color-fg);
    background: var(--color-bg);
  }

  .subnav-item.active {
    color: var(--color-fg);
    box-shadow: inset 2px 0 0 0 var(--color-accent), inset 0 -1px 0 0 var(--color-border);
  }

  .subnav-item:focus-visible {
    outline: var(--border-width) solid var(--color-accent);
    outline-offset: -1px;
  }

  .subnav-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 12px;
    height: 12px;
    line-height: 100%;
  }
</style>
