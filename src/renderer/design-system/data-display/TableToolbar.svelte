<script lang="ts">
  import type { Snippet } from 'svelte'
  import Icon from '../primitives/Icon.svelte'
  import Badge from './Badge.svelte'

  type Props = {
    search?: string
    placeholder?: string
    totalCount?: number
    filteredCount?: number
    isLoading?: boolean
    errorMsg?: string | null
    onsearch?: (value: string) => void
    onclear?: () => void
    filters?: Snippet
    actions?: Snippet
  }

  let {
    search = $bindable(''),
    placeholder = 'Buscar...',
    totalCount,
    filteredCount,
    isLoading = false,
    errorMsg = null,
    onsearch,
    onclear,
    filters,
    actions
  }: Props = $props()

  function handleInput(e: Event) {
    const val = (e.target as HTMLInputElement).value
    search = val
    onsearch?.(val)
  }

  function handleClear() {
    search = ''
    onclear?.()
    onsearch?.('')
  }

  let isFiltered = $derived(search.trim().length > 0)
  let countText = $derived.by(() => {
    if (filteredCount !== undefined && totalCount !== undefined) {
      if (isFiltered) {
        return `${filteredCount} de ${totalCount} ${totalCount === 1 ? 'item' : 'itens'}`
      }
      return `${totalCount} ${totalCount === 1 ? 'item' : 'itens'}`
    }
    if (totalCount !== undefined) {
      return `${totalCount} ${totalCount === 1 ? 'item' : 'itens'}`
    }
    if (filteredCount !== undefined) {
      return `${filteredCount} ${filteredCount === 1 ? 'resultado' : 'resultados'}`
    }
    return null
  })
</script>

<div class="table-toolbar">
  <div class="search-box">
    <Icon name="search" size="sm" />
    <input
      type="text"
      class="search-input"
      value={search}
      {placeholder}
      oninput={handleInput}
    />
    {#if search}
      <button
        type="button"
        class="clear-btn"
        onclick={handleClear}
        aria-label="Limpar busca"
      >
        ✕
      </button>
    {/if}
  </div>

  {#if filters}
    <div class="toolbar-filters">
      {@render filters()}
    </div>
  {/if}

  <div class="toolbar-meta">
    {#if errorMsg}
      <Badge text={errorMsg} tone="danger" />
    {:else if isLoading}
      <Badge text="Carregando..." tone="neutral" />
    {:else if countText}
      <Badge text={countText} tone={isFiltered ? 'info' : 'neutral'} />
    {/if}

    {#if actions}
      <div class="toolbar-actions">
        {@render actions()}
      </div>
    {/if}
  </div>
</div>

<style>
  .table-toolbar {
    display: flex;
    align-items: center;
    height: 40px;
    background: var(--color-bg);
    box-shadow: inset 0 -1px 0 0 var(--color-border);
    flex-shrink: 0;
    box-sizing: border-box;
  }

  .search-box {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: 0 var(--space-3);
    height: 40px;
    flex: 1;
    min-width: 200px;
    box-shadow: inset -1px 0 0 0 var(--color-border);
    color: var(--color-fg-dim);
    transition: background var(--motion-fast);
    box-sizing: border-box;
  }

  .search-box:focus-within {
    box-shadow: inset -1px 0 0 0 var(--color-border-strong);
    background: var(--color-bg-elevated);
    color: var(--color-accent);
  }

  .search-input {
    width: 100%;
    height: 100%;
    background: transparent;
    border: none;
    outline: none;
    color: var(--color-fg);
    font-size: var(--text-sm);
    font-family: var(--font-mono);
    line-height: 100%;
    box-sizing: border-box;
  }

  .search-input::placeholder {
    color: var(--color-fg-dim);
  }

  .clear-btn {
    background: transparent;
    border: none;
    color: var(--color-fg-dim);
    font-size: 11px;
    cursor: pointer;
    padding: 2px 4px;
    line-height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color var(--motion-fast);
  }

  .clear-btn:hover {
    color: var(--color-fg);
  }

  .toolbar-filters {
    display: flex;
    align-items: center;
    height: 40px;
    padding: 0 var(--space-3);
    box-shadow: inset -1px 0 0 0 var(--color-border);
    gap: var(--space-2);
    box-sizing: border-box;
  }

  .toolbar-meta {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: 0 var(--space-3);
    margin-left: auto;
    height: 40px;
    box-sizing: border-box;
  }

  .toolbar-actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
</style>
