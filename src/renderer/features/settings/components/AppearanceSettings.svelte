<script lang="ts">
  import Inspector from '../../../design-system/compositions/Inspector.svelte'
  import Stack from '../../../design-system/layout/Stack.svelte'
  import Label from '../../../design-system/primitives/Label.svelte'
  import Toggle from '../../../design-system/controls/Toggle.svelte'

  let dense = $state(true)
</script>

<Inspector title="Appearance">
  <Stack gap="3">
    <div>
      <Label text="Density" />
      <Toggle bind:checked={dense} label="Grid denso" />
    </div>
    <p class="note">
      Tema Industrial Brutalist fixo nesta fundação. Preferências persistentes entram depois.
    </p>
  </Stack>
</Inspector>

<style>
  .note {
    margin: 0;
    font-size: var(--text-xs);
    color: var(--color-fg-muted);
  }
</style>
