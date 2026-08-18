<script lang="ts">
  import type { Snippet } from 'svelte'

  export type Column = {
    key: string
    label: string
    align?: 'left' | 'center' | 'right'
    width?: string
    sortable?: boolean
  }

  export type Row = Record<string, any>

  type Props = {
    columns?: Column[]
    rows?: Row[]
    bordered?: boolean
    sortable?: boolean
    defaultSortKey?: string
    defaultSortDir?: 'asc' | 'desc'
    emptyMessage?: string
    onrowclick?: (row: Row, index: number) => void
    cell?: Snippet<[{ row: Row; column: Column; value: any; index: number }]>
  }

  let {
    columns = [],
    rows = [],
    bordered = true,
    sortable = true,
    defaultSortKey,
    defaultSortDir = 'asc',
    emptyMessage = 'Nenhum registro cadastrado',
    onrowclick,
    cell
  }: Props = $props()

  // Determinar a chave de ordenação inicial (defaultSortKey ou primeira coluna 'nome' ou primeira coluna)
  let initialKey = $derived(
    defaultSortKey ??
      (columns.find((c) => c.key === 'nome')?.key ?? columns[0]?.key ?? '')
  )

  let sortKey = $state<string>('')
  let sortDir = $state<'asc' | 'desc'>('asc')

  $effect(() => {
    if (!sortKey && initialKey) {
      sortKey = initialKey
      sortDir = defaultSortDir
    }
  })

  function handleHeaderClick(col: Column) {
    if (!sortable || col.sortable === false) return

    if (sortKey === col.key) {
      sortDir = sortDir === 'asc' ? 'desc' : 'asc'
    } else {
      sortKey = col.key
      sortDir = 'asc'
    }
  }

  let sortedRows = $derived.by(() => {
    if (!sortable || !sortKey) return rows

    return [...rows].sort((a, b) => {
      const valA = a[sortKey]
      const valB = b[sortKey]

      if (valA === undefined || valA === null || valA === '') return 1
      if (valB === undefined || valB === null || valB === '') return -1

      let cmp = 0
      if (typeof valA === 'number' && typeof valB === 'number') {
        cmp = valA - valB
      } else {
        cmp = String(valA).localeCompare(String(valB), 'pt-BR', {
          sensitivity: 'base',
          numeric: true
        })
      }

      return sortDir === 'asc' ? cmp : -cmp
    })
  })
</script>

<div class="table-wrap" class:bordered>
  <table class="table">
    <thead>
      <tr>
        {#each columns as col (col.key)}
          <th
            style:text-align={col.align ?? 'left'}
            style:width={col.width ?? undefined}
            class:is-sortable={sortable && col.sortable !== false}
            class:is-sorted={sortKey === col.key}
            onclick={() => handleHeaderClick(col)}
          >
            <div class="th-content" style:justify-content={col.align === 'center' ? 'center' : col.align === 'right' ? 'flex-end' : 'flex-start'}>
              <span class="th-label">{col.label}</span>
              {#if sortable && col.sortable !== false}
                <span class="sort-indicator" class:active={sortKey === col.key}>
                  {#if sortKey === col.key}
                    {sortDir === 'asc' ? '▲' : '▼'}
                  {:else}
                    <span class="sort-idle">⇅</span>
                  {/if}
                </span>
              {/if}
            </div>
          </th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#if sortedRows.length === 0}
        <tr class="empty-row">
          <td colspan={columns.length || 1} class="empty-cell">
            {emptyMessage}
          </td>
        </tr>
      {:else}
        {#each sortedRows as row, i (row.id ?? i)}
          <tr
            class:clickable={!!onrowclick}
            onclick={() => onrowclick?.(row, i)}
          >
            {#each columns as col (col.key)}
              <td
                style:text-align={col.align ?? 'left'}
                style:width={col.width ?? undefined}
              >
                {#if cell}
                  {@render cell({ row, column: col, value: row[col.key], index: i })}
                {:else}
                  {row[col.key] !== undefined && row[col.key] !== null && row[col.key] !== '' ? row[col.key] : '—'}
                {/if}
              </td>
            {/each}
          </tr>
        {/each}
      {/if}
    </tbody>
  </table>
</div>

<style>
  .table-wrap {
    width: 100%;
    overflow: auto;
    background: var(--color-bg);
  }

  .table-wrap.bordered {
    border: var(--border-width) solid var(--color-border);
  }

  .table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--text-sm);
  }

  th,
  td {
    padding: var(--space-2) var(--space-4);
    border-bottom: var(--border-width) solid var(--color-border);
    border-right: var(--border-width) solid var(--color-border);
    text-align: left;
    white-space: nowrap;
    box-sizing: border-box;
    line-height: 100%;
  }

  th:last-child,
  td:last-child {
    border-right: none;
  }

  th {
    height: 40px;
    font-size: var(--text-xs);
    font-weight: 500;
    letter-spacing: var(--tracking-label);
    text-transform: uppercase;
    color: var(--color-fg-muted);
    background: var(--color-bg-elevated);
    user-select: none;
    position: sticky;
    top: 0;
    z-index: 1;
    transition: background var(--motion-fast), color var(--motion-fast);
  }

  td {
    height: 40px;
  }

  th.is-sortable {
    cursor: pointer;
  }

  th.is-sortable:hover {
    background: var(--color-bg);
    color: var(--color-fg);
  }

  th.is-sorted {
    color: var(--color-accent);
    background: var(--color-bg-sunken);
  }

  .th-content {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .th-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .sort-indicator {
    font-size: 10px;
    font-family: var(--font-mono);
    color: var(--color-accent);
    line-height: 1;
  }

  .sort-idle {
    opacity: 0.35;
    font-size: 11px;
  }

  tbody tr {
    transition: background var(--motion-fast);
  }

  tbody tr:hover {
    background: var(--color-bg-elevated);
  }

  tbody tr.clickable {
    cursor: pointer;
  }

  tbody tr:last-child td {
    border-bottom: none;
  }

  .empty-cell {
    text-align: center;
    color: var(--color-fg-dim);
    padding: var(--space-6) var(--space-4);
    font-style: italic;
    border-right: none;
  }
</style>
