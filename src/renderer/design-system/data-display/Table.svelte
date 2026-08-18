<script lang="ts">
  import type { Snippet } from 'svelte'

  export type Column = {
    key: string
    label: string
    align?: 'left' | 'center' | 'right'
    width?: string
  }

  export type Row = Record<string, any>

  type Props = {
    columns?: Column[]
    rows?: Row[]
    bordered?: boolean
    emptyMessage?: string
    onrowclick?: (row: Row, index: number) => void
    cell?: Snippet<[{ row: Row; column: Column; value: any; index: number }]>
  }

  let {
    columns = [],
    rows = [],
    bordered = true,
    emptyMessage = 'Nenhum registro cadastrado',
    onrowclick,
    cell
  }: Props = $props()
</script>

<div class="table-wrap" class:bordered>
  <table class="table">
    <thead>
      <tr>
        {#each columns as col (col.key)}
          <th
            style:text-align={col.align ?? 'left'}
            style:width={col.width ?? undefined}
          >
            {col.label}
          </th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#if rows.length === 0}
        <tr class="empty-row">
          <td colspan={columns.length || 1} class="empty-cell">
            {emptyMessage}
          </td>
        </tr>
      {:else}
        {#each rows as row, i (i)}
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
    padding: var(--space-2) var(--space-3);
    border-bottom: var(--border-width) solid var(--color-border);
    border-right: var(--border-width) solid var(--color-border);
    text-align: left;
    white-space: nowrap;
  }

  th:last-child,
  td:last-child {
    border-right: none;
  }

  th {
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
    padding: var(--space-6) var(--space-3);
    font-style: italic;
    border-right: none;
  }
</style>
