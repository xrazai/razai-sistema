<script lang="ts">
  import Topbar from '../design-system/navigation/Topbar.svelte'
  import Status from '../design-system/data-display/Status.svelte'

  type Route = 'dashboard' | 'settings' | 'design-system'

  type Props = {
    route: Route
  }

  let { route }: Props = $props()

  const titles: Record<Route, string> = {
    dashboard: 'Início',
    settings: 'Settings',
    'design-system': 'Design System'
  }
</script>

<Topbar title={titles[route]}>
  <Status label="Online" tone="ok" />
</Topbar>
