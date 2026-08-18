<script lang="ts">
  type Props = {
    value?: string
    placeholder?: string
    type?: string
    disabled?: boolean
    id?: string
    prefix?: string
    suffix?: string
    oninput?: (e: Event) => void
  }

  let {
    value = $bindable(''),
    placeholder = '',
    type = 'text',
    disabled = false,
    id,
    prefix,
    suffix,
    oninput
  }: Props = $props()
</script>

{#if prefix || suffix}
  <div class="input-group" class:disabled>
    {#if prefix}
      <span class="affix prefix">{prefix}</span>
    {/if}
    <input class="input grouped" {id} {type} {placeholder} {disabled} bind:value {oninput} />
    {#if suffix}
      <span class="affix suffix">{suffix}</span>
    {/if}
  </div>
{:else}
  <input class="input" {id} {type} {placeholder} {disabled} bind:value {oninput} />
{/if}

<style>
  .input {
    width: 100%;
    padding: var(--space-2) var(--space-3);
    border: var(--border-width) solid var(--color-border-strong);
    border-radius: var(--radius);
    background: var(--color-bg-sunken);
    color: var(--color-fg);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    outline: none;
    transition: border-color var(--motion-fast);
  }

  .input:hover:not(:disabled) {
    border-color: var(--color-accent);
  }

  .input:focus:not(:disabled) {
    border-color: var(--color-accent);
    background: var(--color-bg);
  }

  .input::placeholder {
    color: var(--color-fg-dim);
  }

  .input:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .input-group {
    display: flex;
    align-items: stretch;
    width: 100%;
    border: var(--border-width) solid var(--color-border-strong);
    background: var(--color-bg-sunken);
    transition: border-color var(--motion-fast);
  }

  .input-group:hover:not(.disabled) {
    border-color: var(--color-accent);
  }

  .input-group:focus-within:not(.disabled) {
    border-color: var(--color-accent);
    background: var(--color-bg);
  }

  .input-group.disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .input.grouped {
    border: none;
    background: transparent;
    padding: var(--space-2) var(--space-3);
    flex: 1;
    min-width: 0;
  }

  .affix {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 var(--space-2);
    font-size: var(--text-xs);
    font-family: var(--font-mono);
    color: var(--color-fg-muted);
    background: var(--color-bg-elevated);
    user-select: none;
    letter-spacing: var(--tracking-tight);
    white-space: nowrap;
  }

  .affix.prefix {
    border-right: var(--border-width) solid var(--color-border);
  }

  .affix.suffix {
    border-left: var(--border-width) solid var(--color-border);
  }
</style>
