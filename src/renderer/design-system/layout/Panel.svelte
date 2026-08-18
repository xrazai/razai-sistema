<script lang="ts">
  import type { Snippet } from 'svelte'

  type Props = {
    title?: string
    flush?: boolean
    children?: Snippet
  }

  let { title = '', flush = false, children }: Props = $props()
</script>

<section class="panel">
  {#if title}
    <header class="head">{title}</header>
  {/if}
  <div class="body" class:flush>
    {@render children?.()}
  </div>
</section>

<style>
  .panel {
    display: flex;
    flex-direction: column;
    min-height: 0;
    border: var(--border-width) solid var(--color-border);
    background: var(--color-bg);
  }

  .head {
    padding: var(--space-2) var(--space-3);
    border-bottom: var(--border-width) solid var(--color-border);
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-header);
    text-transform: uppercase;
    color: var(--color-fg-muted);
    background: var(--color-bg-elevated);
  }

  .body {
    padding: var(--cell-pad);
    min-height: 0;
    flex: 1;
  }

  .body.flush {
    padding: 0;
  }
</style>
