<script lang="ts">
  type Column = { key: string; label: string }
  type Row = Record<string, string>

  type Props = {
    columns?: Column[]
    rows?: Row[]
    bordered?: boolean
  }

  let { columns = [], rows = [], bordered = true }: Props = $props()
</script>

<div class="table-wrap" class:bordered>
  <table class="table">
    <thead>
      <tr>
        {#each columns as col (col.key)}
          <th>{col.label}</th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each rows as row, i (i)}
        <tr>
          {#each columns as col (col.key)}
            <td>{row[col.key] ?? '—'}</td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .table-wrap {
    width: 100%;
    overflow: auto;
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
    letter-spacing: var(--tracking-label);
    text-transform: uppercase;
    color: var(--color-fg-muted);
    background: var(--color-bg-elevated);
  }

  tbody tr:last-child td {
    border-bottom: none;
  }
</style>
