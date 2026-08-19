<script lang="ts">
  import EmptyState from '../../design-system/compositions/EmptyState.svelte'
</script>

<div class="page">
  <div class="fill">
    <EmptyState
      title="Nenhuma venda registrada"
      description="O fluxo de vendas e registro de saídas aparecerá aqui."
      icon="cart"
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
