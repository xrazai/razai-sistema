<script lang="ts">
  import type { Snippet } from 'svelte'

  type Props = {
    variant?: 'primary' | 'secondary' | 'ghost'
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
    onclick?: (e: MouseEvent) => void
    children?: Snippet
  }

  let {
    variant = 'secondary',
    disabled = false,
    type = 'button',
    onclick,
    children
  }: Props = $props()
</script>

<button class="btn" data-variant={variant} {type} {disabled} {onclick}>
  {@render children?.()}
</button>

<style>
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    border: var(--border-width) solid var(--color-border-strong);
    border-radius: var(--radius);
    background: var(--color-bg-elevated);
    color: var(--color-fg);
    font-size: var(--text-sm);
    letter-spacing: var(--tracking-tight);
    text-transform: uppercase;
    transition: background var(--motion-fast), border-color var(--motion-fast),
      color var(--motion-fast);
  }

  .btn:hover:not(:disabled) {
    border-color: var(--color-accent);
  }

  .btn:active:not(:disabled) {
    background: var(--color-accent);
    color: var(--color-accent-fg);
    border-color: var(--color-accent);
  }

  .btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .btn[data-variant='primary'] {
    background: var(--color-accent);
    color: var(--color-accent-fg);
    border-color: var(--color-accent);
  }

  .btn[data-variant='primary']:hover:not(:disabled) {
    background: var(--color-fg);
    border-color: var(--color-fg);
  }

  .btn[data-variant='primary']:active:not(:disabled) {
    background: var(--color-bg);
    color: var(--color-fg);
    border-color: var(--color-border-strong);
  }

  .btn[data-variant='primary']:focus-visible {
    outline-color: var(--color-accent-fg);
  }

  .btn[data-variant='ghost'] {
    background: transparent;
    border-color: var(--color-border);
  }

  .btn[data-variant='ghost']:active:not(:disabled) {
    background: var(--color-bg-sunken);
    color: var(--color-fg);
    border-color: var(--color-border-strong);
  }
</style>
