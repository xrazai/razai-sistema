<script lang="ts">
  import EmptyState from '../../design-system/compositions/EmptyState.svelte'
  import Button from '../../design-system/controls/Button.svelte'
  import Icon from '../../design-system/primitives/Icon.svelte'
  import RelatoriosHub from './components/RelatoriosHub.svelte'
  import RelatorioVendasTecidoCor from './components/RelatorioVendasTecidoCor.svelte'
  import { router } from '../../shell/router.svelte'
  import type { RelatorioKpis, VendaDiariaItem } from '../../../shared/types'

  let kpis = $state<RelatorioKpis | null>(null)
  let vendas7Dias = $state<VendaDiariaItem[]>([])
  let isLoading = $state(true)
  let errorMsg = $state<string | null>(null)

  let isSubRouteVendasTecidoCor = $derived(router.subRoute === 'vendas-tecido-cor')

  async function loadData() {
    isLoading = true
    errorMsg = null
    try {
      if (typeof window !== 'undefined' && window.razai?.relatorios) {
        const [kpisRes, vendas7DiasRes] = await Promise.all([
          window.razai.relatorios.getKpis(),
          window.razai.relatorios.getVendasUltimos7Dias()
        ])
        kpis = kpisRes
        vendas7Dias = vendas7DiasRes
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados de relatórios:', err)
      errorMsg = err?.message || 'Falha ao carregar indicadores de relatórios.'
    } finally {
      isLoading = false
    }
  }

  $effect(() => {
    if (router.route === 'relatorios') {
      loadData()
    }
  })
</script>

<div class="relatorios-page">
  {#if errorMsg}
    <div class="fill-center">
      <EmptyState
        title="Erro ao carregar relatórios"
        description={errorMsg}
      >
        {#snippet actions()}
          <Button variant="primary" onclick={loadData}>
            <Icon name="check" size="sm" />
            <span>Tentar Novamente</span>
          </Button>
        {/snippet}
      </EmptyState>
    </div>
  {:else if isSubRouteVendasTecidoCor}
    <RelatorioVendasTecidoCor />
  {:else}
    <RelatoriosHub
      {kpis}
      {vendas7Dias}
      {isLoading}
      onrefresh={loadData}
    />
  {/if}
</div>

<style>
  .relatorios-page {
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
  }

  .fill-center {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 0;
  }
</style>
