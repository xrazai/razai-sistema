<script lang="ts">
  type Tab = { id: string; label: string }

  type Props = {
    tabs?: Tab[]
    active?: string
    onselect?: (id: string) => void
  }

  let { tabs = [], active = '', onselect }: Props = $props()
</script>

<div class="tabs" role="tablist">
  {#each tabs as tab (tab.id)}
    <button
      type="button"
      role="tab"
      class="tab"
      class:active={tab.id === active}
      aria-selected={tab.id === active}
      onclick={() => onselect?.(tab.id)}
    >
      {tab.label}
    </button>
  {/each}
</div>

<style>
  .tabs {
    display: flex;
    height: 32px;
    border-bottom: var(--border-width) solid var(--color-border);
    box-sizing: border-box;
  }

  .tab {
    display: inline-flex;
    align-items: center;
    height: 100%;
    padding: 0 var(--space-3);
    border: none;
    border-right: var(--border-width) solid var(--color-border);
    background: transparent;
    color: var(--color-fg-muted);
    font-size: var(--text-xs);
    line-height: 100%;
    letter-spacing: var(--tracking-label);
    text-transform: uppercase;
    box-sizing: border-box;
  }

  .tab:hover {
    color: var(--color-fg);
  }

  .tab.active {
    color: var(--color-accent-fg);
    background: var(--color-accent);
  }

  .tab:focus-visible {
    outline: var(--border-width) solid var(--color-accent);
    outline-offset: -1px;
  }

  .tab.active:focus-visible {
    outline-color: var(--color-accent-fg);
  }
</style>
