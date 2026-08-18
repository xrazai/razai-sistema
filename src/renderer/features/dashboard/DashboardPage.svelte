<script lang="ts">
  import EmptyState from '../../design-system/compositions/EmptyState.svelte'
</script>

<div class="page">
  <div class="fill">
    <EmptyState
      title="Sistema vazio"
      description="Nenhum módulo ou registro ainda. O conteúdo do produto aparece aqui quando o domínio for definido."
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
