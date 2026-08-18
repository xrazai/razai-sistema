<script lang="ts">
  type Props = {
    value?: string
    placeholder?: string
    type?: string
    disabled?: boolean
    id?: string
    prefix?: string
    suffix?: string
    swatch?: string | null
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
    swatch,
    oninput
  }: Props = $props()

  let hasCustomRight = $derived(Boolean(suffix || swatch !== undefined))
</script>

{#if prefix || hasCustomRight}
  <div class="input-group" class:disabled>
    {#if prefix}
      <span class="affix prefix">{prefix}</span>
    {/if}
    <input class="input grouped" {id} {type} {placeholder} {disabled} bind:value {oninput} />
    {#if swatch !== undefined}
      <div class="swatch-container">
        <div
          class="inline-swatch"
          style:background-color={swatch || 'transparent'}
          class:is-empty={!swatch}
          title={swatch ? `Amostra: ${swatch}` : 'Sem cor válida'}
        ></div>
      </div>
    {:else if suffix}
      <span class="affix suffix">{suffix}</span>
    {/if}
  </div>
{:else}
  <input class="input" {id} {type} {placeholder} {disabled} bind:value {oninput} />
{/if}

<style>
  .input {
    width: 100%;
    height: 32px;
    padding: 0 var(--space-3);
    border: var(--border-width) solid var(--color-border-strong);
    border-radius: var(--radius);
    background: var(--color-bg-sunken);
    color: var(--color-fg);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    line-height: 100%;
    outline: none;
    box-sizing: border-box;
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
    height: 32px;
    border: var(--border-width) solid var(--color-border-strong);
    background: var(--color-bg-sunken);
    box-sizing: border-box;
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
    height: 100%;
    padding: 0 var(--space-3);
    flex: 1;
    min-width: 0;
    line-height: 100%;
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

  .swatch-container {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 var(--space-2);
    background: var(--color-bg-elevated);
    border-left: var(--border-width) solid var(--color-border);
  }

  .inline-swatch {
    width: 18px;
    height: 18px;
    border: var(--border-width) solid var(--color-border-strong);
    box-sizing: border-box;
  }

  .inline-swatch.is-empty {
    background: repeating-conic-gradient(
      var(--color-bg-elevated) 0% 25%,
      var(--color-bg-sunken) 0% 50%
    ) 50% / 8px 8px;
  }
</style>
