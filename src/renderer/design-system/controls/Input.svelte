<script lang="ts">
  type Props = {
    value?: string
    placeholder?: string
    type?: string
    disabled?: boolean
    id?: string
    oninput?: (e: Event) => void
  }

  let {
    value = $bindable(''),
    placeholder = '',
    type = 'text',
    disabled = false,
    id,
    oninput
  }: Props = $props()
</script>

<input class="input" {id} {type} {placeholder} {disabled} bind:value {oninput} />

<style>
  .input {
    width: 100%;
    padding: var(--space-2) var(--space-3);
    border: var(--border-width) solid var(--color-border-strong);
    border-radius: var(--radius);
    background: var(--color-bg-sunken);
    color: var(--color-fg);
    font-size: var(--text-sm);
  }

  .input:hover:not(:disabled) {
    border-color: var(--color-accent);
  }

  .input::placeholder {
    color: var(--color-fg-dim);
  }

  .input:disabled {
    opacity: 0.45;
  }
</style>
