<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import Inspector from '../../../design-system/compositions/Inspector.svelte'
  import Stack from '../../../design-system/layout/Stack.svelte'
  import Label from '../../../design-system/primitives/Label.svelte'
  import Select from '../../../design-system/controls/Select.svelte'
  import Toggle from '../../../design-system/controls/Toggle.svelte'
  import Badge from '../../../design-system/data-display/Badge.svelte'
  import Button from '../../../design-system/controls/Button.svelte'
  import Progress from '../../../design-system/data-display/Progress.svelte'
  import type { UpdateInfo, UpdateStatus } from '../../../../shared/types'

  let defaultRoute = $state('dashboard')
  let denseGrid = $state(true)
  let autoFocusSearch = $state(true)
  let saveStatus = $state<string | null>(null)
  let saveTimeout: ReturnType<typeof setTimeout> | null = null

  let appVersion = $state('0.1.0')
  let updateStatus = $state<UpdateStatus>('idle')
  let updateVersion = $state<string | undefined>(undefined)
  let downloadProgress = $state<number | null>(null)
  let updateMessage = $state<string | null>(null)
  let isChecking = $state(false)
  let unsubscribeUpdater: (() => void) | null = null

  const routeOptions = [
    { value: 'dashboard', label: 'Início (Padrão)' },
    { value: 'vendas', label: 'Vendas' },
    { value: 'pedidos', label: 'Pedidos' },
    { value: 'tecidos', label: 'Tecidos (Catálogo)' },
    { value: 'cores', label: 'Cores (Paleta)' },
    { value: 'vinculos', label: 'Vínculos' },
    { value: 'settings', label: 'Settings (Configurações)' },
    { value: 'design-system', label: 'Design System (Living Catalog)' }
  ]

  async function loadSettings() {
    if (typeof window !== 'undefined' && window.razai) {
      try {
        if (window.razai.getAppInfo) {
          const info = await window.razai.getAppInfo()
          if (info?.version) appVersion = info.version
        }

        if (window.razai.settings) {
          const all = await window.razai.settings.getAll()
          if (all.default_route) defaultRoute = all.default_route
          if (all.dense_grid !== undefined) denseGrid = all.dense_grid === 'true'
          if (all.auto_focus_search !== undefined) autoFocusSearch = all.auto_focus_search === 'true'
        }

        if (window.razai.updater?.getStatus) {
          const status = await window.razai.updater.getStatus()
          handleStatusUpdate(status)
        }
      } catch (err) {
        console.error('Erro ao carregar preferências:', err)
      }
    }
  }

  function handleStatusUpdate(info: UpdateInfo) {
    if (!info) return
    updateStatus = info.status
    if (info.version) updateVersion = info.version
    if (info.currentVersion) appVersion = info.currentVersion

    if (info.status === 'checking') {
      isChecking = true
      updateMessage = 'Verificando atualizações no GitHub...'
    } else if (info.status === 'available') {
      isChecking = false
      updateMessage = `Nova versão v${info.version || ''} disponível.`
    } else if (info.status === 'not-available') {
      isChecking = false
      updateMessage = `Aplicação na versão mais recente (v${appVersion}).`
    } else if (info.status === 'downloading') {
      isChecking = false
      downloadProgress = info.progress?.percent ?? 0
      updateMessage = `Baixando atualização: ${downloadProgress}%`
    } else if (info.status === 'downloaded') {
      isChecking = false
      downloadProgress = 100
      updateMessage = `Versão v${info.version || ''} pronta para instalação.`
    } else if (info.status === 'error') {
      isChecking = false
      updateMessage = info.error || 'Erro na verificação de atualização.'
    }
  }

  async function checkUpdates() {
    if (typeof window !== 'undefined' && window.razai?.updater) {
      isChecking = true
      updateMessage = 'Consultando releases oficiais...'
      try {
        const res = await window.razai.updater.check()
        if (res.ok) {
          if (res.status === 'not-available') {
            updateMessage = `Aplicação na versão mais recente (v${appVersion}).`
          } else if (res.status === 'available') {
            updateMessage = `Nova versão v${res.version || ''} encontrada.`
          }
        } else {
          updateMessage = res.error || 'Não foi possível verificar atualizações.'
        }
      } catch (err: any) {
        updateMessage = err?.message || 'Erro de comunicação ao verificar atualizações.'
      } finally {
        isChecking = false
      }
    }
  }

  async function installUpdate() {
    if (typeof window !== 'undefined' && window.razai?.updater) {
      try {
        await window.razai.updater.install()
      } catch (err: any) {
        updateMessage = `Erro ao disparar instalação: ${err?.message || err}`
      }
    }
  }

  async function updateSetting(key: string, value: string) {
    if (typeof window !== 'undefined' && window.razai?.settings) {
      try {
        await window.razai.settings.set(key, value)
        saveStatus = 'Salvo no SQLite'
        if (saveTimeout) clearTimeout(saveTimeout)
        saveTimeout = setTimeout(() => {
          saveStatus = null
        }, 2000)
      } catch (err) {
        console.error('Erro ao salvar preferência:', err)
      }
    }
  }

  onMount(() => {
    loadSettings()
    if (typeof window !== 'undefined' && window.razai?.updater?.onStatusChange) {
      unsubscribeUpdater = window.razai.updater.onStatusChange(handleStatusUpdate)
    }
  })

  onDestroy(() => {
    if (unsubscribeUpdater) {
      unsubscribeUpdater()
      unsubscribeUpdater = null
    }
  })
</script>

<Inspector title="Aparência e Preferências de UI">
  <Stack gap="3">
    <div class="field-item">
      <div class="field-header">
        <Label text="Módulo Inicial Padrão" for="default-route-select" />
        {#if saveStatus}
          <Badge text={saveStatus} tone="ok" />
        {/if}
      </div>
      <Select
        id="default-route-select"
        options={routeOptions}
        bind:value={defaultRoute}
        onchange={() => updateSetting('default_route', defaultRoute)}
      />
      <span class="field-desc">Define qual tela é aberta automaticamente ao iniciar a aplicação.</span>
    </div>

    <div class="field-item">
      <Label text="Densidade Modular (Grid 40px)" />
      <Toggle
        bind:checked={denseGrid}
        label="Grid denso ativo (Ritmo de 40px)"
        onchange={() => updateSetting('dense_grid', String(denseGrid))}
      />
      <span class="field-desc">Mantém o alinhamento de 40px contínuo entre Sidebar, Topbar e Tabelas.</span>
    </div>

    <div class="field-item">
      <Label text="Foco Automático de Busca" />
      <Toggle
        bind:checked={autoFocusSearch}
        label="Focar automaticamente campo de busca"
        onchange={() => updateSetting('auto_focus_search', String(autoFocusSearch))}
      />
      <span class="field-desc">Ativa atalho rápido de busca nas telas de Tecidos e Cores.</span>
    </div>

    <div class="field-item update-box">
      <div class="field-header">
        <Label text="Atualizações do Sistema" />
        {#if updateStatus === 'checking'}
          <Badge text="Verificando..." tone="info" />
        {:else if updateStatus === 'available'}
          <Badge text={`Nova Versão v${updateVersion || ''}`} tone="warn" />
        {:else if updateStatus === 'downloading'}
          <Badge text="Baixando..." tone="info" />
        {:else if updateStatus === 'downloaded'}
          <Badge text="Pronto para Instalar" tone="ok" />
        {:else if updateStatus === 'error'}
          <Badge text="Erro" tone="danger" />
        {:else if updateStatus === 'not-available'}
          <Badge text="Atualizado" tone="ok" />
        {:else}
          <Badge text={`v${appVersion}`} tone="neutral" />
        {/if}
      </div>

      <div class="update-row">
        <div class="version-meta">
          <span class="version-label">Versão Instalada:</span>
          <span class="version-val numeric">v{appVersion}</span>
        </div>
        <div class="update-actions">
          {#if updateStatus === 'downloaded'}
            <Button variant="primary" size="sm" onclick={installUpdate}>
              Reiniciar e Instalar
            </Button>
          {:else}
            <Button
              variant="secondary"
              size="sm"
              disabled={isChecking || updateStatus === 'downloading'}
              onclick={checkUpdates}
            >
              {isChecking ? 'Verificando...' : 'Verificar Atualizações'}
            </Button>
          {/if}
        </div>
      </div>

      {#if updateStatus === 'downloading' && downloadProgress !== null}
        <div class="progress-wrap">
          <Progress value={downloadProgress} label={`Baixando v${updateVersion || ''}...`} />
        </div>
      {/if}

      {#if updateMessage}
        <span class="field-desc" class:error={updateStatus === 'error'}>{updateMessage}</span>
      {:else}
        <span class="field-desc">Canal oficial de releases GitHub: xrazai/razai-sistema.</span>
      {/if}
    </div>

    <div class="theme-info">
      <span class="caption">Tema: Industrial Brutalist Grid UI · Fundo: #0E0E0E · Linhas: 1px</span>
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

  .field-desc {
    font-size: var(--text-xs);
    color: var(--color-fg-dim);
    font-family: var(--font-mono);
    line-height: 100%;
    margin-top: 2px;
  }

  .field-desc.error {
    color: var(--color-danger);
  }

  .update-box {
    padding: var(--space-2);
    border: var(--border-width) solid var(--color-border);
    background: var(--color-bg-sunken);
    gap: var(--space-2);
  }

  .update-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 32px;
  }

  .version-meta {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .version-label {
    font-size: var(--text-xs);
    color: var(--color-fg-muted);
    font-family: var(--font-mono);
    line-height: 100%;
    text-transform: uppercase;
    letter-spacing: var(--tracking-label);
  }

  .version-val {
    font-size: var(--text-sm);
    color: var(--color-fg);
    font-weight: 600;
    line-height: 100%;
  }

  .update-actions {
    display: flex;
    align-items: center;
  }

  .progress-wrap {
    padding-top: var(--space-1);
  }

  .theme-info {
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
