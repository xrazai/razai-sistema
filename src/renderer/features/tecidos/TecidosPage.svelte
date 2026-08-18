<script lang="ts">
  import Panel from '../../design-system/layout/Panel.svelte'
  import EmptyState from '../../design-system/compositions/EmptyState.svelte'
</script>

<div class="page">
  <Panel title="Tecidos">
    <div class="fill">
      <EmptyState
        title="Nenhum tecido cadastrado"
        description="O catálogo e especificações de tecidos aparecerão aqui."
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
