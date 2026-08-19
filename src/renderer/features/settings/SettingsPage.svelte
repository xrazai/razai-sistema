<script lang="ts">
  import Cell from '../../design-system/primitives/Cell.svelte'
  import Stack from '../../design-system/layout/Stack.svelte'
  import Tabs from '../../design-system/navigation/Tabs.svelte'
  import ScrollArea from '../../design-system/layout/ScrollArea.svelte'
  import DatabaseSettings from './components/DatabaseSettings.svelte'
  import AppearanceSettings from './components/AppearanceSettings.svelte'
  import PrinterSettings from './components/PrinterSettings.svelte'
  import DiagnosticSettings from './components/DiagnosticSettings.svelte'

  let activeTab = $state('geral')

  const tabs = [
    { id: 'geral', label: 'Geral & UI' },
    { id: 'banco', label: 'Banco & Backup' },
    { id: 'impressora', label: 'Impressora ESC/POS' },
    { id: 'diagnostico', label: 'Diagnóstico & Logs' }
  ]
</script>

<div class="page">
  <div class="settings-layout">
    <div class="tabs-bar">
      <Tabs {tabs} active={activeTab} onselect={(id) => (activeTab = id)} />
    </div>
    <div class="tab-content">
      <ScrollArea>
        <Cell pad={true}>
          {#if activeTab === 'geral'}
            <Stack gap="3">
              <AppearanceSettings />
            </Stack>
          {:else if activeTab === 'banco'}
            <Stack gap="3">
              <DatabaseSettings />
            </Stack>
          {:else if activeTab === 'impressora'}
            <Stack gap="3">
              <PrinterSettings />
            </Stack>
          {:else if activeTab === 'diagnostico'}
            <Stack gap="3">
              <DiagnosticSettings />
            </Stack>
          {/if}
        </Cell>
      </ScrollArea>
    </div>
  </div>
</div>

<style>
  .page {
    height: 100%;
    overflow: hidden;
  }

  .settings-layout {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .tabs-bar {
    height: 32px;
    background: var(--color-bg-sunken);
    box-shadow: inset 0 -1px 0 0 var(--color-border);
    flex-shrink: 0;
  }

  .tab-content {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }
</style>
