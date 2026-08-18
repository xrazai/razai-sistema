<script lang="ts">
  type Option = { value: string; label: string }

  type Props = {
    value?: string
    options?: Option[]
    disabled?: boolean
    id?: string
    onchange?: (e: Event) => void
  }

  let {
    value = $bindable(''),
    options = [],
    disabled = false,
    id,
    onchange
  }: Props = $props()
</script>

<select class="select" {id} {disabled} bind:value {onchange}>
  {#each options as opt (opt.value)}
    <option value={opt.value}>{opt.label}</option>
  {/each}
</select>

<style>
  .select {
    width: 100%;
    padding: var(--space-2) var(--space-3);
    border: var(--border-width) solid var(--color-border-strong);
    border-radius: var(--radius);
    background: var(--color-bg-sunken);
    color: var(--color-fg);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    outline: none;
    cursor: pointer;
    transition: border-color var(--motion-fast);
  }

  .select:hover:not(:disabled) {
    border-color: var(--color-accent);
  }

  .select:focus:not(:disabled) {
    border-color: var(--color-accent);
    background: var(--color-bg);
  }

  .select:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  option {
    background: var(--color-bg-elevated);
    color: var(--color-fg);
  }
</style>
