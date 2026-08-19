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
    height: 40px;
    padding: var(--space-2) var(--space-4);
    box-shadow: inset 0 -1px 0 0 var(--color-border);
    background: var(--color-bg-elevated);
    box-sizing: border-box;
    line-height: 100%;
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
