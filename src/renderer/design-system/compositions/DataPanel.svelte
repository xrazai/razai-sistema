<script lang="ts">
  import Panel from '../layout/Panel.svelte'
  import Table from '../data-display/Table.svelte'

  type Column = { key: string; label: string }
  type Row = Record<string, string>

  type Props = {
    title?: string
    columns?: Column[]
    rows?: Row[]
  }

  let { title = 'Data', columns = [], rows = [] }: Props = $props()
</script>

<Panel {title} flush>
  <Table {columns} {rows} bordered={false} />
</Panel>
