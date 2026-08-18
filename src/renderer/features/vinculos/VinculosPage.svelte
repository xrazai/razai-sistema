<script lang="ts">
  import EmptyState from '../../design-system/compositions/EmptyState.svelte'
</script>

<div class="page">
  <div class="fill">
    <EmptyState
      title="Nenhum vínculo cadastrado"
      description="As relações e vínculos entre tecidos e cores aparecerão aqui."
    />
  </div>
</div>

<style>
  .page {
    height: 100%;
    min-height: 0;
    display: grid;
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
