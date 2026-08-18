<script lang="ts">
  import AppShell from './shell/AppShell.svelte'
  import DashboardPage from './features/dashboard/DashboardPage.svelte'
  import SettingsPage from './features/settings/SettingsPage.svelte'
  import DesignSystemPage from './pages/DesignSystemPage.svelte'

  type Route = 'dashboard' | 'settings' | 'design-system'

  let route = $state<Route>('dashboard')
</script>

<AppShell {route} onnavigate={(r) => (route = r)}>
  {#if route === 'dashboard'}
    <DashboardPage />
  {:else if route === 'settings'}
    <SettingsPage />
  {:else}
    <DesignSystemPage />
  {/if}
</AppShell>
