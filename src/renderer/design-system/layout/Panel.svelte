<script lang="ts">
  import type { Snippet } from 'svelte'

  type Props = {
    title?: string
    flush?: boolean
    children?: Snippet
    actions?: Snippet
    header?: Snippet
  }

  let { title = '', flush = false, children, actions, header }: Props = $props()
</script>

<section class="panel">
  {#if title || actions || header}
    <header class="head">
      <div class="head-content">
        {#if header}
          {@render header()}
        {:else if title}
          <span class="title">{title}</span>
        {/if}
      </div>
      {#if actions}
        <div class="actions">
          {@render actions()}
        </div>
      {/if}
    </header>
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
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    min-height: 44px;
    padding: var(--space-2) var(--space-4);
    border-bottom: var(--border-width) solid var(--color-border);
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-header);
    text-transform: uppercase;
    color: var(--color-fg-muted);
    background: var(--color-bg-elevated);
  }

  .head-content {
    display: flex;
    align-items: center;
    min-width: 0;
    flex: 1;
  }

  .title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .actions {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
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
