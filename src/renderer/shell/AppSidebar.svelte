<script lang="ts">
  import Sidebar from '../design-system/navigation/Sidebar.svelte'
  import NavItem from '../design-system/navigation/NavItem.svelte'
  import Divider from '../design-system/primitives/Divider.svelte'

  type Route = 'dashboard' | 'settings' | 'design-system'

  type Props = {
    route: Route
    onnavigate: (route: Route) => void
  }

  let { route, onnavigate }: Props = $props()
</script>

<Sidebar>
  <div class="brand">RAZAI / SISTEMA</div>
  <Divider />
  <NavItem
    label="Início"
    icon="dash"
    active={route === 'dashboard'}
    onclick={() => onnavigate('dashboard')}
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
    padding: var(--space-3);
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-header);
    text-transform: uppercase;
    color: var(--color-fg);
  }
</style>
