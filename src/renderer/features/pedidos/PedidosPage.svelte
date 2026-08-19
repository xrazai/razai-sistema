<script lang="ts">
  import EmptyState from '../../design-system/compositions/EmptyState.svelte'
</script>

<div class="page">
  <div class="fill">
    <EmptyState
      title="Nenhum pedido registrado"
      description="A gestão e controle de pedidos de clientes aparecerão aqui."
      icon="orders"
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
