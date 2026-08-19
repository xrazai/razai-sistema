<script lang="ts">
  import type { Snippet } from 'svelte'

  type Props = {
    children?: Snippet
  }

  let { children }: Props = $props()
</script>

<aside class="sidebar">
  {@render children?.()}
</aside>

<style>
  .sidebar {
    display: flex;
    flex-direction: column;
    width: 220px;
    min-width: 220px;
    box-shadow: inset -1px 0 0 0 var(--color-border);
    background: var(--color-bg-elevated);
  }

  .sidebar :global(span) {
    line-height: 100%;
  }
</style>
