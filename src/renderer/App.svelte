<script lang="ts">
  import AppShell from './shell/AppShell.svelte'
  import DashboardPage from './features/dashboard/DashboardPage.svelte'
  import TecidosPage from './features/tecidos/TecidosPage.svelte'
  import CoresPage from './features/cores/CoresPage.svelte'
  import VinculosPage from './features/vinculos/VinculosPage.svelte'
  import SettingsPage from './features/settings/SettingsPage.svelte'
  import DesignSystemPage from './pages/DesignSystemPage.svelte'

  type Route = 'dashboard' | 'tecidos' | 'cores' | 'vinculos' | 'settings' | 'design-system'

  let route = $state<Route>('dashboard')
</script>

<AppShell {route} onnavigate={(r) => (route = r)}>
  {#if route === 'dashboard'}
    <DashboardPage />
  {:else if route === 'tecidos'}
    <TecidosPage />
  {:else if route === 'cores'}
    <CoresPage />
  {:else if route === 'vinculos'}
    <VinculosPage />
  {:else if route === 'settings'}
    <SettingsPage />
  {:else}
    <DesignSystemPage />
  {/if}
</AppShell>
