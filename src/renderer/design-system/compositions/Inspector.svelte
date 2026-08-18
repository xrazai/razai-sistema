<script lang="ts">
  import type { Snippet } from 'svelte'
  import Panel from '../layout/Panel.svelte'

  type Props = {
    title?: string
    children?: Snippet
  }

  let { title = 'Inspector', children }: Props = $props()
</script>

<Panel {title}>
  {@render children?.()}
</Panel>
