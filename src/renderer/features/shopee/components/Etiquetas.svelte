<script lang="ts">
  import { onMount } from 'svelte'
  import Badge from '../../../design-system/data-display/Badge.svelte'
  import Progress from '../../../design-system/data-display/Progress.svelte'
  import Icon from '../../../design-system/primitives/Icon.svelte'
  import Panel from '../../../design-system/layout/Panel.svelte'
  import Button from '../../../design-system/controls/Button.svelte'
  import Select from '../../../design-system/controls/Select.svelte'
  import Input from '../../../design-system/controls/Input.svelte'
  import FileDropZone from '../../../design-system/controls/FileDropZone.svelte'
  import EtiquetaReviewItem from './EtiquetaReviewItem.svelte'
  import EtiquetaDeleteBatchDialog from './EtiquetaDeleteBatchDialog.svelte'
  import { router } from '../../../shell/router.svelte'
  import type { ShopeeEtiquetaEquivalencia, ShopeeEtiquetaLearningStats, ShopeeEtiquetaLoteDetalhe, ShopeeEtiquetaLoteResumo, ShopeeEtiquetaProgress } from '../../../../shared/shopee-etiquetas'

  let batches = $state<ShopeeEtiquetaLoteResumo[]>([])
  let selected = $state<ShopeeEtiquetaLoteDetalhe | null>(null)
  let printers = $state<Array<{ name: string; portName?: string }>>([])
  let zebraPrinter = $state('')
  let importing = $state(false)
  let testingPrinter = $state(false)
  let message = $state('')
  let progressMessage = $state('')
  let equivalences = $state<ShopeeEtiquetaEquivalencia[]>([])
  let equivalenceKind = $state<'tecido' | 'cor' | 'sku'>('tecido')
  let equivalenceSource = $state('')
  let equivalenceCanonical = $state('')
  let showDeleteBatch = $state(false)
  let deletingBatch = $state(false)
  let deleteBatchError = $state('')
  let learningStats = $state<ShopeeEtiquetaLearningStats>({ exactCorrections: 0, trainingSamples: 0, skuEquivalences: 0 })

  function toneFor(status: string): 'neutral' | 'ok' | 'warn' | 'danger' | 'info' {
    if (status === 'concluido') return 'ok'
    if (status === 'falhou' || status === 'impressao_incerta') return 'danger'
    if (status === 'revisao' || status.includes('pendente')) return 'warn'
    return 'info'
  }

  async function loadBatches(selectId?: string) {
    batches = await window.razai.shopee.etiquetas.listBatches()
    const target = selectId ?? selected?.id ?? batches[0]?.id
    selected = target ? await window.razai.shopee.etiquetas.getBatch(target) : null
  }

  async function loadSettings() {
    const [list, saved, aliases, stats] = await Promise.all([
      window.razai.shopee.etiquetas.listPrinters(), window.razai.shopee.etiquetas.getZebraPrinter(),
      window.razai.shopee.etiquetas.listEquivalences(), window.razai.shopee.etiquetas.getLearningStats()
    ])
    printers = list; zebraPrinter = saved ?? ''; equivalences = aliases; learningStats = stats
  }

  async function importFiles(files: File[]) {
    importing = true; message = ''
    try {
      const result = await window.razai.shopee.etiquetas.importFiles(files)
      if (!result.ok) throw new Error(result.error)
      message = `${files.length} arquivo(s) adicionados ao lote.`
      await loadBatches(result.loteId)
    } catch (error: any) { message = error?.message || 'Falha ao importar os arquivos.' }
    finally { importing = false }
  }

  async function savePrinter() { await window.razai.shopee.etiquetas.setZebraPrinter(zebraPrinter); message = 'Impressora Zebra salva.' }
  async function testPrinter() {
    testingPrinter = true
    const result = await window.razai.shopee.etiquetas.testZebra(zebraPrinter)
    message = result.ok ? 'Etiqueta de teste enviada.' : result.error ?? 'Falha no teste.'
    testingPrinter = false
  }
  async function correctItem(input: Parameters<typeof window.razai.shopee.etiquetas.correctItem>[0]) {
    selected = await window.razai.shopee.etiquetas.correctItem(input)
    await Promise.all([loadSettings(), loadBatches(selected?.id)])
  }
  async function batchAction(action: 'resume' | 'retry' | 'confirm' | 'pdf' | 'open') {
    if (!selected) return
    const api = window.razai.shopee.etiquetas
    const result = action === 'resume' ? await api.resumeBatch(selected.id)
      : action === 'retry' ? await api.retryPrinting(selected.id)
        : action === 'confirm' ? await api.confirmPrinted(selected.id)
        : action === 'pdf' ? await api.regeneratePdf(selected.id) : await api.openPdf(selected.id)
    if (!result.ok) message = result.error ?? 'Ação não concluída.'
    await loadBatches(selected.id)
  }
  async function saveEquivalence() {
    if (!equivalenceSource.trim() || !equivalenceCanonical.trim()) return
    await window.razai.shopee.etiquetas.saveEquivalence({ kind: equivalenceKind, source: equivalenceSource, canonicalValue: equivalenceCanonical })
    equivalenceSource = ''; equivalenceCanonical = ''; await loadSettings()
  }
  async function deleteEquivalence(id: string) { await window.razai.shopee.etiquetas.deleteEquivalence(id); await loadSettings() }

  function requestBatchDeletion() {
    deleteBatchError = ''
    showDeleteBatch = true
  }

  async function confirmBatchDeletion() {
    if (!selected || deletingBatch) return
    deletingBatch = true
    deleteBatchError = ''
    const deletedId = selected.id
    try {
      const result = await window.razai.shopee.etiquetas.deleteBatch(deletedId)
      if (!result.ok) {
        deleteBatchError = result.error ?? 'Não foi possível excluir o lote.'
        return
      }
      showDeleteBatch = false
      selected = null
      progressMessage = ''
      message = `Lote ${deletedId.slice(0, 8).toUpperCase()} excluído.`
      await Promise.all([loadBatches(), loadSettings()])
    } finally {
      deletingBatch = false
    }
  }

  onMount(() => {
    void Promise.all([loadBatches(), loadSettings()])
    return window.razai.shopee.etiquetas.onProgress((progress: ShopeeEtiquetaProgress) => {
      progressMessage = progress.message; void loadBatches(progress.loteId)
    })
  })
</script>

<div class="etiquetas-page">
  <div class="submodule-toolbar">
    <div class="toolbar-left"><Button variant="ghost" size="sm" onclick={() => router.navigate('shopee')}><Icon name="arrow-left" size="sm" /><span>Shopee</span></Button><span class="divider"></span><Icon name="tag" /><span class="toolbar-title">SHOPEE / ETIQUETAS</span></div>
    <Badge text={selected?.status ?? 'PRONTO'} tone={selected ? toneFor(selected.status) : 'neutral'} />
  </div>
  <div class="etiquetas-content">
    <header class="submodule-intro"><div><h1>Etiquetas</h1><p>Extração local, impressão Zebra e mapa consolidado de cortes.</p></div><span class="module-code">MOD / SHP / 01</span></header>
    <div class="primary-grid">
      <Panel title="Importar lote">
        <FileDropZone disabled={importing} title={importing ? 'Importando arquivos...' : 'Arraste vários ZIPs ou ZPLs'} description="Um drop gera um lote e um único PDF de cortes" onfiles={importFiles} />
        {#if message}<div class="inline-message">{message}</div>{/if}
      </Panel>
      <Panel title="Zebra USB">
        <div class="printer-controls"><Select options={[{ value: '', label: 'Selecione a Zebra' }, ...printers.map((p) => ({ value: p.name, label: `${p.name} (${p.portName || 'USB'})` }))]} bind:value={zebraPrinter} /><Button variant="secondary" size="sm" onclick={savePrinter} disabled={!zebraPrinter}>Salvar</Button><Button variant="secondary" size="sm" onclick={testPrinter} disabled={!zebraPrinter || testingPrinter}>{testingPrinter ? 'Enviando...' : 'Teste ZPL'}</Button></div>
        <div class="technical-note">SPOOLER WINDOWS · MODO RAW · CONFIGURAÇÃO INDEPENDENTE DO ESC/POS</div>
      </Panel>
    </div>

    {#if selected}
      <Panel title={`Lote ${selected.id.slice(0, 8).toUpperCase()}`}>
        <div class="batch-metrics"><div><span>ARQUIVOS</span><strong>{selected.fileCount}</strong></div><div><span>PÁGINAS</span><strong>{selected.pageCount}</strong></div><div><span>PEDIDOS</span><strong>{selected.orderCount}</strong></div><div><span>CORTES</span><strong>{selected.itemCount}</strong></div><div><span>REVISÕES</span><strong>{selected.reviewCount}</strong></div></div>
        <div class="batch-progress"><Progress value={selected.progress} label={progressMessage || selected.errorMessage || selected.status} /></div>
        <p class="learning-summary">MEMÓRIA {selected.items.filter((item) => item.validationSource === 'exact_memory').length} · EQUIVALÊNCIAS/REGRAS {selected.items.filter((item) => ['equivalence', 'safe_rule'].includes(item.validationSource)).length} · MANUAIS {selected.items.filter((item) => item.validationSource === 'manual').length}</p>
        <div class="batch-actions">
          {#if selected.status === 'revisao'}<Button variant="primary" size="sm" onclick={() => batchAction('resume')} disabled={selected.reviewCount > 0}>Retomar lote</Button>{/if}
          {#if selected.status === 'impressao_pendente' || selected.status === 'impressao_incerta'}<Button variant="primary" size="sm" onclick={() => batchAction('retry')}>Imprimir pendentes</Button>{/if}
          {#if selected.status === 'impressao_incerta'}<Button variant="secondary" size="sm" onclick={() => batchAction('confirm')}>Confirmar como impresso</Button>{/if}
          {#if selected.status === 'pdf_pendente'}<Button variant="primary" size="sm" onclick={() => batchAction('pdf')}>Gerar PDF novamente</Button>{/if}
          {#if selected.pdfAvailable}<Button variant="secondary" size="sm" onclick={() => batchAction('open')}>Abrir PDF</Button>{/if}
          {#if ['recebido', 'revisao', 'falhou'].includes(selected.status)}<span class="delete-batch-action"><Button variant="danger" size="sm" onclick={requestBatchDeletion}>Excluir lote</Button></span>{/if}
        </div>
      </Panel>
      {#if selected.items.some((item) => item.reviewRequired)}
        <Panel title="Revisão obrigatória"><div class="review-list">{#each selected.items.filter((item) => item.reviewRequired) as item (item.id)}<EtiquetaReviewItem {item} onsave={correctItem} />{/each}</div></Panel>
      {/if}
    {/if}

    <div class="secondary-grid">
      <Panel title="Histórico de lotes"><div class="history-list">
        {#each batches as batch (batch.id)}<button class:active={selected?.id === batch.id} onclick={async () => { selected = await window.razai.shopee.etiquetas.getBatch(batch.id) }}><span class="history-id">{batch.id.slice(0, 8).toUpperCase()}</span><span>{new Date(batch.createdAt).toLocaleString('pt-BR')}</span><span>{batch.fileCount} arq. · {batch.itemCount} cortes</span><Badge text={batch.status} tone={toneFor(batch.status)} /></button>{:else}<div class="empty-row">Nenhum lote processado.</div>{/each}
      </div></Panel>
      <Panel title="Equivalências Shopee">
        <div class="equivalence-form"><Select options={[{ value: 'tecido', label: 'Tecido' }, { value: 'cor', label: 'Cor' }, { value: 'sku', label: 'SKU' }]} bind:value={equivalenceKind} /><Input bind:value={equivalenceSource} placeholder="Texto recebido" /><Input bind:value={equivalenceCanonical} placeholder="Valor normalizado" /><Button variant="primary" size="sm" onclick={saveEquivalence}>Adicionar</Button></div>
        <p class="learning-summary">CORREÇÕES EXATAS {learningStats.exactCorrections} · ALIASES SKU {learningStats.skuEquivalences} · AMOSTRAS {learningStats.trainingSamples}</p>
        <div class="equivalence-list">{#each equivalences as item (item.id)}<div><Badge text={item.kind} /><span>{item.sourceKey}</span><strong>{item.canonicalValue}</strong><Button variant="ghost" size="sm" onclick={() => deleteEquivalence(item.id)}>Excluir</Button></div>{/each}</div>
      </Panel>
    </div>
  </div>
</div>

{#if showDeleteBatch && selected}
  <EtiquetaDeleteBatchDialog
    batch={selected}
    deleting={deletingBatch}
    error={deleteBatchError}
    onconfirm={confirmBatchDeletion}
    onclose={() => { showDeleteBatch = false; deleteBatchError = '' }}
  />
{/if}

<style>
  .etiquetas-page, .etiquetas-content { display: flex; flex-direction: column; min-height: 0; }
  .etiquetas-page { height: 100%; background: var(--color-bg); }
  .submodule-toolbar { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); height: 40px; min-height: 40px; padding: 0 var(--space-4); box-shadow: inset 0 -1px 0 0 var(--color-border); background: var(--color-bg-elevated); box-sizing: border-box; }
  .toolbar-left { display: inline-flex; align-items: center; gap: var(--space-2); min-width: 0; }
  .toolbar-title, .module-code { color: var(--color-fg); font-size: var(--text-xs); letter-spacing: var(--tracking-header); line-height: 100%; text-transform: uppercase; }
  .divider { width: 1px; height: 16px; background: var(--color-border); }
  .etiquetas-content { display: grid; grid-template-columns: minmax(0, 1fr); grid-auto-rows: max-content; align-content: start; gap: var(--space-5); flex: 1; overflow-y: auto; padding: var(--space-6); box-sizing: border-box; }
  .submodule-intro { display: flex; align-items: flex-end; justify-content: space-between; min-height: 64px; padding-bottom: var(--space-4); border-bottom: var(--border-width) solid var(--color-border); box-sizing: border-box; }
  h1 { font-size: 28px; line-height: 100%; letter-spacing: var(--tracking-tight); }
  .submodule-intro p { margin-top: var(--space-2); color: var(--color-fg-muted); font-family: var(--font-sans); font-size: var(--text-md); line-height: 100%; }
  .module-code { color: var(--color-fg-dim); }
  .primary-grid, .secondary-grid { display: grid; grid-template-columns: 1.2fr .8fr; gap: var(--space-4); }
  .printer-controls, .equivalence-form { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; gap: var(--space-2); align-items: center; }
  .equivalence-form { grid-template-columns: 120px minmax(0, 1fr) minmax(0, 1fr) auto; }
  .technical-note, .inline-message { margin-top: var(--space-3); color: var(--color-fg-muted); font-size: var(--text-xs); line-height: 100%; }
  .batch-metrics { display: grid; grid-template-columns: repeat(5, 1fr); border: var(--border-width) solid var(--color-border); }
  .batch-metrics > div { display: flex; flex-direction: column; justify-content: center; gap: var(--space-1); height: 56px; padding: 0 var(--space-3); box-shadow: inset -1px 0 0 0 var(--color-border); box-sizing: border-box; }
  .batch-metrics span { color: var(--color-fg-muted); font-size: 10px; letter-spacing: var(--tracking-label); line-height: 100%; }
  .batch-metrics strong { font-size: var(--text-lg); line-height: 100%; }
  .batch-progress { padding: var(--space-3) 0; } .batch-actions { display: flex; gap: var(--space-2); min-height: 32px; } .review-list { display: flex; flex-direction: column; gap: var(--space-3); }
  .learning-summary { min-height: 24px; margin: 0; padding: var(--space-2) 0; color: var(--color-fg-muted); font-size: 10px; letter-spacing: var(--tracking-label); line-height: 100%; box-sizing: border-box; }
  .delete-batch-action { display: inline-flex; margin-left: auto; line-height: 100%; }
  .history-list, .equivalence-list { max-height: 320px; overflow-y: auto; }
  .history-list button { display: grid; grid-template-columns: 80px 1fr 130px auto; align-items: center; width: 100%; min-height: 40px; padding: 0 var(--space-2); border: 0; box-shadow: inset 0 -1px 0 0 var(--color-border); background: var(--color-bg); color: var(--color-fg-muted); font-family: var(--font-mono); font-size: var(--text-xs); text-align: left; line-height: 100%; box-sizing: border-box; }
  .history-list button:hover, .history-list button.active { background: var(--color-bg-sunken); color: var(--color-fg); } .history-id { color: var(--color-info); font-weight: 700; }
  .empty-row { display: flex; align-items: center; min-height: 80px; padding: var(--space-3); color: var(--color-fg-muted); font-size: var(--text-xs); line-height: 100%; }
  .equivalence-list { margin-top: var(--space-3); border: var(--border-width) solid var(--color-border); }
  .equivalence-list > div { display: grid; grid-template-columns: 72px minmax(0, 1fr) minmax(0, 1fr) auto; align-items: center; min-height: 40px; padding: 0 var(--space-2); box-shadow: inset 0 -1px 0 0 var(--color-border); font-size: var(--text-xs); line-height: 100%; }
  @media (max-width: 960px) { .primary-grid, .secondary-grid { grid-template-columns: 1fr; } .batch-metrics { grid-template-columns: repeat(3, 1fr); } }
</style>
