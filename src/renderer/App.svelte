<script lang="ts">
  import AppShell from './shell/AppShell.svelte'
  import DashboardPage from './features/dashboard/DashboardPage.svelte'
  import VendasPage from './features/vendas/VendasPage.svelte'
  import PedidosPage from './features/pedidos/PedidosPage.svelte'
  import RelatoriosPage from './features/relatorios/RelatoriosPage.svelte'
  import ShopeePage from './features/shopee/ShopeePage.svelte'
  import TecidosPage from './features/tecidos/TecidosPage.svelte'
  import CoresPage from './features/cores/CoresPage.svelte'
  import VinculosPage from './features/vinculos/VinculosPage.svelte'
  import SettingsPage from './features/settings/SettingsPage.svelte'
  import DesignSystemPage from './pages/DesignSystemPage.svelte'
  import { router } from './shell/router.svelte'
</script>

<AppShell route={router.route} onnavigate={(r) => router.navigate(r)}>
  {#if router.route === 'dashboard'}
    <DashboardPage />
  {:else if router.route === 'vendas'}
    <VendasPage />
  {:else if router.route === 'pedidos'}
    <PedidosPage />
  {:else if router.route === 'relatorios'}
    <RelatoriosPage />
  {:else if router.route === 'shopee'}
    <ShopeePage />
  {:else if router.route === 'tecidos'}
    <TecidosPage />
  {:else if router.route === 'cores'}
    <CoresPage />
  {:else if router.route === 'vinculos'}
    <VinculosPage />
  {:else if router.route === 'settings'}
    <SettingsPage />
  {:else if router.route === 'design-system'}
    <DesignSystemPage />
  {/if}
</AppShell>
