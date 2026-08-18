<script lang="ts">
  import type { Snippet } from 'svelte'

  type Props = {
    title?: string
    children?: Snippet
  }

  let { title = '', children }: Props = $props()
</script>

<header class="topbar">
  {#if title}
    <div class="title">{title}</div>
  {/if}
  <div class="actions">
    {@render children?.()}
  </div>
</header>

<style>
  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    min-height: 40px;
    padding: 0 var(--space-3);
    border-bottom: var(--border-width) solid var(--color-border);
    background: var(--color-bg-elevated);
  }

  .title {
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-header);
    text-transform: uppercase;
    color: var(--color-fg);
  }

  .actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
</style>
