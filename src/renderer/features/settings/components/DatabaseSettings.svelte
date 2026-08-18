<script lang="ts">
  import { onMount } from 'svelte'
  import Inspector from '../../../design-system/compositions/Inspector.svelte'
  import Stack from '../../../design-system/layout/Stack.svelte'
  import Label from '../../../design-system/primitives/Label.svelte'
  import Status from '../../../design-system/data-display/Status.svelte'

  let schemaVersion = $state('…')
  let ok = $state(false)

  onMount(async () => {
    try {
      const health = await window.razai.getDbHealth()
      schemaVersion = health.schemaVersion
      ok = health.ok
    } catch {
      schemaVersion = 'unavailable'
      ok = false
    }
  })
</script>

<Inspector title="Database">
  <Stack gap="3">
    <div>
      <Label text="Status" />
      <Status label={ok ? 'Connected' : 'Error'} tone={ok ? 'ok' : 'danger'} />
    </div>
    <div>
      <Label text="Schema version" />
      <div class="value numeric">{schemaVersion}</div>
    </div>
  </Stack>
</Inspector>

<style>
  .value {
    font-size: var(--text-md);
  }
</style>
