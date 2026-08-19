<script lang="ts">
  import EmptyState from '../../design-system/compositions/EmptyState.svelte'
  import Button from '../../design-system/controls/Button.svelte'
  import Icon from '../../design-system/primitives/Icon.svelte'
  import RelatoriosHub from './components/RelatoriosHub.svelte'
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
    <div class="subroute-container">
      <div class="subroute-header">
        <Button variant="ghost" size="sm" onclick={() => router.navigate('#relatorios')}>
          <Icon name="arrow-left" size="sm" />
          <span>Voltar ao Hub de Relatórios</span>
        </Button>
        <span class="subroute-title">RELATÓRIO ANALÍTICO / VENDAS POR TECIDO E COR</span>
      </div>
      <div class="subroute-content">
        <EmptyState
          title="Relatório Analítico de Vendas por Tecido e Cor"
          description="Este relatório analítico detalhado com tabela expansível e filtros customizados será carregado aqui."
        >
          {#snippet actions()}
            <Button variant="secondary" onclick={() => router.navigate('#relatorios')}>
              <span>Retornar ao Hub</span>
            </Button>
          {/snippet}
        </EmptyState>
      </div>
    </div>
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

  .subroute-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }

  .subroute-header {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    height: 40px;
    padding: 0 var(--space-4);
    background: var(--color-bg-elevated);
    box-shadow: inset 0 -1px 0 0 var(--color-border);
    box-sizing: border-box;
    flex-shrink: 0;
  }

  .subroute-title {
    font-size: var(--text-xs);
    font-family: var(--font-mono);
    letter-spacing: var(--tracking-header);
    color: var(--color-fg-muted);
    line-height: 100%;
  }

  .subroute-content {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
