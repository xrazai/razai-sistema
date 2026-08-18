<script lang="ts">
  export type BreadcrumbItem = {
    label: string
    onclick?: () => void
    active?: boolean
  }

  type Props = {
    items?: BreadcrumbItem[]
  }

  let { items = [] }: Props = $props()
</script>

<nav class="breadcrumb" aria-label="Navegação">
  {#each items as item, i (i)}
    {#if i > 0}
      <span class="sep" aria-hidden="true">/</span>
    {/if}
    {#if item.onclick && !item.active}
      <button class="crumb link" onclick={item.onclick} type="button">
        {item.label}
      </button>
    {:else}
      <span class="crumb" class:active={item.active}>
        {item.label}
      </span>
    {/if}
  {/each}
</nav>

<style>
  .breadcrumb {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-header);
    text-transform: uppercase;
    font-family: var(--font-mono);
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .sep {
    color: var(--color-fg-dim);
    user-select: none;
  }

  .crumb {
    color: var(--color-fg-muted);
    background: transparent;
    border: none;
    padding: 0;
    font-family: inherit;
    font-size: inherit;
    letter-spacing: inherit;
    text-transform: inherit;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .crumb.link {
    cursor: pointer;
    color: var(--color-fg-muted);
    transition: color var(--motion-fast);
  }

  .crumb.link:hover {
    color: var(--color-accent);
    text-decoration: underline;
  }

  .crumb.active {
    color: var(--color-fg);
    font-weight: 600;
  }
</style>
