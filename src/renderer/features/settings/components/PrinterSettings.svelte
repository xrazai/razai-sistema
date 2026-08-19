<script lang="ts">
  import { onMount } from 'svelte'
  import Inspector from '../../../design-system/compositions/Inspector.svelte'
  import Stack from '../../../design-system/layout/Stack.svelte'
  import Label from '../../../design-system/primitives/Label.svelte'
  import Select from '../../../design-system/controls/Select.svelte'
  import Button from '../../../design-system/controls/Button.svelte'
  import Badge from '../../../design-system/data-display/Badge.svelte'
  import type { PrinterInfo } from '../../../../shared/types'

  let printers = $state<PrinterInfo[]>([])
  let selectedPrinter = $state('')
  let loading = $state(true)
  let printing = $state(false)
  let statusMessage = $state<string | null>(null)
  let statusTone = $state<'neutral' | 'ok' | 'warn' | 'danger' | 'info'>('neutral')
  let statusTimeout: ReturnType<typeof setTimeout> | null = null

  function showStatus(msg: string, tone: 'neutral' | 'ok' | 'warn' | 'danger' | 'info' = 'ok', duration = 3000) {
    statusMessage = msg
    statusTone = tone
    if (statusTimeout) clearTimeout(statusTimeout)
    statusTimeout = setTimeout(() => {
      statusMessage = null
    }, duration)
  }

  async function loadPrinters() {
    loading = true
    try {
      if (typeof window !== 'undefined' && window.razai) {
        const [list, savedDefault] = await Promise.all([
          window.razai.printer.list(),
          window.razai.settings.get('printer_name')
        ])
        printers = list

        if (savedDefault && list.some(p => p.name === savedDefault)) {
          selectedPrinter = savedDefault
        } else if (list.some(p => p.name.includes('G250'))) {
          // Auto-seleciona Gertec G250 se presente
          const g250 = list.find(p => p.name.includes('G250'))!
          selectedPrinter = g250.name
          await window.razai.settings.set('printer_name', g250.name)
        } else if (list.length > 0) {
          selectedPrinter = list[0].name
        }
      }
    } catch (err) {
      console.error('Erro ao listar impressoras:', err)
      showStatus('Falha ao listar impressoras', 'danger')
    } finally {
      loading = false
    }
  }

  async function handleSelectPrinter(name: string) {
    selectedPrinter = name
    if (typeof window !== 'undefined' && window.razai?.settings) {
      try {
        await window.razai.settings.set('printer_name', name)
        showStatus(`Impressora padrão: ${name}`, 'ok')
      } catch (err) {
        console.error('Erro ao salvar impressora padrão:', err)
        showStatus('Erro ao salvar configuração', 'danger')
      }
    }
  }

  async function handleTestPrint() {
    if (!selectedPrinter) {
      showStatus('Selecione uma impressora primeiro', 'warn')
      return
    }

    printing = true
    showStatus('Enviando bytes ESC/POS...', 'info')

    try {
      const res = await window.razai.printer.printTest(selectedPrinter)
      if (res.ok) {
        showStatus('Cupom de teste impresso com sucesso!', 'ok', 4000)
      } else {
        showStatus(`Erro: ${res.error || 'Falha ao imprimir'}`, 'danger', 5000)
      }
    } catch (err: any) {
      showStatus(`Erro: ${err?.message || 'Falha ao comunicar com impressora'}`, 'danger', 5000)
    } finally {
      printing = false
    }
  }

  onMount(() => {
    loadPrinters()
  })
</script>

<Inspector title="Impressora Térmica (ESC/POS 80mm)">
  <Stack gap="3">
    <div class="field-item">
      <div class="field-header">
        <Label text="Dispositivo de Impressão" for="printer-select" />
        {#if statusMessage}
          <Badge text={statusMessage} tone={statusTone} />
        {:else if loading}
          <Badge text="Buscando portas..." tone="neutral" />
        {/if}
      </div>

      <div class="controls-row">
        <div class="select-col">
          <Select
            id="printer-select"
            options={printers.map(p => ({
              value: p.name,
              label: `${p.name} (${p.portName || 'USB'})`
            }))}
            bind:value={selectedPrinter}
            onchange={() => handleSelectPrinter(selectedPrinter)}
            disabled={loading || printers.length === 0}
          />
        </div>
        <Button
          variant="secondary"
          size="sm"
          onclick={loadPrinters}
          disabled={loading}
        >
          Atualizar
        </Button>
      </div>
      <span class="field-desc">
        Driver detectado no Windows Spooler. O envio é realizado em buffer RAW direto para o hardware.
      </span>
    </div>

    <div class="specs-grid">
      <div class="spec-cell">
        <span class="spec-label">MODELO ALVO</span>
        <span class="spec-value">Gertec G250W</span>
      </div>
      <div class="spec-cell">
        <span class="spec-label">BOBINA</span>
        <span class="spec-value">80 mm</span>
      </div>
      <div class="spec-cell">
        <span class="spec-label">GRID ESC/POS</span>
        <span class="spec-value">48 Colunas</span>
      </div>
      <div class="spec-cell">
        <span class="spec-label">GUILHOTINA</span>
        <span class="spec-value">Auto-Cut Ativo</span>
      </div>
    </div>

    <div class="actions-row">
      <Button
        variant="primary"
        onclick={handleTestPrint}
        disabled={loading || printing || !selectedPrinter}
      >
        {printing ? 'Enviando Bytes...' : 'Imprimir Cupom de Teste (80mm)'}
      </Button>
    </div>

    <div class="tech-info">
      <span class="caption">
        Protocolo nativo: ESC/POS Binário (CP850) · Conexão USB Direct Spooler · Zero delay de renderização DOM
      </span>
    </div>
  </Stack>
</Inspector>

<style>
  .field-item {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .field-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .controls-row {
    display: flex;
    gap: var(--space-2);
    align-items: center;
  }

  .select-col {
    flex: 1;
  }

  .field-desc {
    font-size: var(--text-xs);
    color: var(--color-fg-dim);
    font-family: var(--font-mono);
    line-height: 100%;
    margin-top: 2px;
  }

  .specs-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1px;
    background: var(--color-border);
    border: var(--border-width) solid var(--color-border);
  }

  .spec-cell {
    background: var(--color-bg);
    padding: var(--space-2);
    display: flex;
    flex-direction: column;
    gap: 4px;
    height: 48px;
    box-sizing: border-box;
    justify-content: center;
  }

  .spec-label {
    font-size: 10px;
    color: var(--color-fg-dim);
    font-family: var(--font-mono);
    letter-spacing: 0.05em;
    line-height: 100%;
  }

  .spec-value {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-fg);
    font-family: var(--font-mono);
    line-height: 100%;
  }

  .actions-row {
    display: flex;
    justify-content: flex-start;
    padding-top: var(--space-1);
  }

  .tech-info {
    padding-top: var(--space-2);
    border-top: var(--border-width) solid var(--color-border);
  }

  .caption {
    font-size: var(--text-xs);
    color: var(--color-fg-muted);
    font-family: var(--font-mono);
    line-height: 100%;
  }
</style>
