<script lang="ts">
  type Props = {
    checked?: boolean
    label?: string
    disabled?: boolean
    id?: string
    onchange?: (e: Event) => void
  }

  let {
    checked = $bindable(false),
    label = '',
    disabled = false,
    id,
    onchange
  }: Props = $props()
</script>

<label class="toggle" class:disabled>
  <input {id} type="checkbox" role="switch" bind:checked {disabled} {onchange} />
  <span class="track" aria-hidden="true"><span class="thumb"></span></span>
  {#if label}<span class="text">{label}</span>{/if}
</label>

<style>
  .toggle {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    height: 24px;
    min-height: 24px;
    cursor: pointer;
    font-size: var(--text-sm);
    line-height: 100%;
    box-sizing: border-box;
  }

  .toggle.disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  .track {
    width: 28px;
    height: 14px;
    border: var(--border-width) solid var(--color-border-strong);
    background: var(--color-bg-sunken);
    display: inline-flex;
    align-items: center;
    padding: 1px;
  }

  .thumb {
    width: 10px;
    height: 10px;
    background: var(--color-fg-dim);
    transition: transform var(--motion-fast), background var(--motion-fast);
  }

  input:checked + .track .thumb {
    transform: translateX(14px);
    background: var(--color-accent);
  }

  input:focus-visible + .track {
    outline: var(--border-width) solid var(--color-accent);
    outline-offset: 1px;
  }

  .text {
    letter-spacing: var(--tracking-tight);
    text-transform: uppercase;
    font-size: var(--text-xs);
    color: var(--color-fg-muted);
    line-height: 100%;
  }
</style>
