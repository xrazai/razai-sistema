<script lang="ts">
  import Panel from '../layout/Panel.svelte'
  import Grid from '../layout/Grid.svelte'
  import Cell from '../primitives/Cell.svelte'
  import Metric from '../data-display/Metric.svelte'

  type Item = { label: string; value: string; unit?: string }

  type Props = {
    title?: string
    items?: Item[]
  }

  let { title = 'Metrics', items = [] }: Props = $props()
</script>

<Panel {title} flush>
  <Grid bare cols={items.length <= 2 ? 2 : 3}>
    {#each items as item (item.label)}
      <Cell>
        <Metric label={item.label} value={item.value} unit={item.unit} />
      </Cell>
    {/each}
  </Grid>
</Panel>
