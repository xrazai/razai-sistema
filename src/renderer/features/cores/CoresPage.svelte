<script lang="ts">
  import Panel from '../../design-system/layout/Panel.svelte'
  import EmptyState from '../../design-system/compositions/EmptyState.svelte'
</script>

<div class="page">
  <Panel title="Cores">
    <div class="fill">
      <EmptyState
        title="Nenhuma cor cadastrada"
        description="A paleta e referências de cores aparecerão aqui."
      />
    </div>
  </Panel>
</div>

<style>
  .page {
    height: 100%;
    min-height: 0;
    display: grid;
  }

  .page :global(.panel) {
    height: 100%;
    min-height: 0;
  }

  .page :global(.body) {
    display: grid;
    min-height: 0;
  }

  .fill {
    height: 100%;
    min-height: 0;
    display: grid;
  }

  .fill :global(.empty) {
    min-height: 100%;
  }
</style>
