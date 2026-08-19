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

<label class="checkbox" class:disabled>
  <input {id} type="checkbox" bind:checked {disabled} {onchange} />
  <span class="box" aria-hidden="true">
    {#if checked}
      <svg viewBox="0 0 14 14"><path d="M2.5 7.5 L5.5 10.5 L11.5 3.5" /></svg>
    {/if}
  </span>
  {#if label}<span class="text">{label}</span>{/if}
</label>

<style>
  .checkbox {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    height: 24px;
    min-height: 24px;
    font-size: var(--text-sm);
    line-height: 100%;
    cursor: pointer;
    box-sizing: border-box;
  }

  .checkbox.disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  .box {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    border: var(--border-width) solid var(--color-border-strong);
    background: var(--color-bg-sunken);
  }

  input:checked + .box {
    background: var(--color-accent);
    border-color: var(--color-accent);
  }

  input:focus-visible + .box {
    outline: var(--border-width) solid var(--color-accent);
    outline-offset: 1px;
  }

  svg {
    width: 10px;
    height: 10px;
    fill: none;
    stroke: var(--color-accent-fg);
    stroke-width: 2;
  }

  .text {
    letter-spacing: var(--tracking-tight);
    text-transform: uppercase;
    font-size: var(--text-xs);
    color: var(--color-fg-muted);
    line-height: 100%;
  }
</style>
