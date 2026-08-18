<script lang="ts">
  import Icon from '../primitives/Icon.svelte'

  type Props = {
    label: string
    icon?: string
    active?: boolean
    onclick?: () => void
  }

  let { label, icon, active = false, onclick }: Props = $props()
</script>

<button type="button" class="nav-item" class:active {onclick}>
  {#if icon}
    <Icon name={icon} size="sm" />
  {/if}
  <span>{label}</span>
</button>

<style>
  .nav-item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    width: 100%;
    height: 36px;
    padding: var(--space-2) var(--space-3);
    border: none;
    border-bottom: var(--border-width) solid var(--color-border);
    background: transparent;
    color: var(--color-fg-muted);
    font-size: var(--text-sm);
    line-height: 100%;
    letter-spacing: var(--tracking-tight);
    text-align: left;
    text-transform: uppercase;
    box-sizing: border-box;
  }

  .nav-item span {
    line-height: 100%;
  }

  .nav-item:hover {
    color: var(--color-fg);
    background: var(--color-bg);
  }

  .nav-item.active {
    color: var(--color-accent-fg);
    background: var(--color-accent);
  }

  .nav-item.active :global(.icon) {
    color: var(--color-accent-fg);
  }

  .nav-item:focus-visible {
    outline: var(--border-width) solid var(--color-accent);
    outline-offset: -1px;
  }

  .nav-item.active:focus-visible {
    outline-color: var(--color-accent-fg);
  }
</style>
