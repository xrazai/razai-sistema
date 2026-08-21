<script lang="ts">
  import type { Snippet } from 'svelte'
  import AppSidebar from './AppSidebar.svelte'
  import AppTopbar from './AppTopbar.svelte'
  import type { Route } from './router.svelte'

  type Props = {
    route: Route
    onnavigate: (route: string) => void
    children?: Snippet
  }

  let { route, onnavigate, children }: Props = $props()
</script>

<div class="shell">
  <AppSidebar {route} {onnavigate} />
  <div class="main">
    <AppTopbar {route} />
    <main class="content">
      {@render children?.()}
    </main>
  </div>
</div>

<style>
  .shell {
    display: grid;
    grid-template-columns: 220px 1fr;
    height: 100%;
    border: var(--border-width) solid var(--color-border);
  }

  .main {
    display: grid;
    grid-template-rows: 40px 1fr;
    min-width: 0;
    min-height: 0;
  }

  .content {
    min-height: 0;
    overflow: auto;
    background: var(--color-bg);
  }
</style>
