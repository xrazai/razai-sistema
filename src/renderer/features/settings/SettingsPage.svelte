<script lang="ts">
  import Cell from '../../design-system/primitives/Cell.svelte'
  import Stack from '../../design-system/layout/Stack.svelte'
  import DatabaseSettings from './components/DatabaseSettings.svelte'
  import AppearanceSettings from './components/AppearanceSettings.svelte'
</script>

<div class="page">
  <Cell>
    <Stack gap="3">
      <DatabaseSettings />
      <AppearanceSettings />
    </Stack>
  </Cell>
</div>

<style>
  .page {
    height: 100%;
  }
</style>
