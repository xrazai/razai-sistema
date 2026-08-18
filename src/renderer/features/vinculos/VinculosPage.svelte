<script lang="ts">
  import Panel from '../../design-system/layout/Panel.svelte'
  import EmptyState from '../../design-system/compositions/EmptyState.svelte'
</script>

<div class="page">
  <Panel title="Vínculos">
    <div class="fill">
      <EmptyState
        title="Nenhum vínculo cadastrado"
        description="As relações e vínculos entre tecidos e cores aparecerão aqui."
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
