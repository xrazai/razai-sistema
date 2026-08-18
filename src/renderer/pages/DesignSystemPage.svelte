<script lang="ts">
  import ScrollArea from '../design-system/layout/ScrollArea.svelte'
  import Stack from '../design-system/layout/Stack.svelte'
  import Grid from '../design-system/layout/Grid.svelte'
  import Panel from '../design-system/layout/Panel.svelte'
  import SplitPane from '../design-system/layout/SplitPane.svelte'
  import Cell from '../design-system/primitives/Cell.svelte'
  import Divider from '../design-system/primitives/Divider.svelte'
  import Label from '../design-system/primitives/Label.svelte'
  import Icon from '../design-system/primitives/Icon.svelte'
  import Surface from '../design-system/primitives/Surface.svelte'
  import Button from '../design-system/controls/Button.svelte'
  import Input from '../design-system/controls/Input.svelte'
  import Select from '../design-system/controls/Select.svelte'
  import Checkbox from '../design-system/controls/Checkbox.svelte'
  import Toggle from '../design-system/controls/Toggle.svelte'
  import Status from '../design-system/data-display/Status.svelte'
  import Metric from '../design-system/data-display/Metric.svelte'
  import Badge from '../design-system/data-display/Badge.svelte'
  import Progress from '../design-system/data-display/Progress.svelte'
  import Table from '../design-system/data-display/Table.svelte'
  import Sidebar from '../design-system/navigation/Sidebar.svelte'
  import Topbar from '../design-system/navigation/Topbar.svelte'
  import Tabs from '../design-system/navigation/Tabs.svelte'
  import NavItem from '../design-system/navigation/NavItem.svelte'
  import Inspector from '../design-system/compositions/Inspector.svelte'
  import DataPanel from '../design-system/compositions/DataPanel.svelte'
  import MetricPanel from '../design-system/compositions/MetricPanel.svelte'
  import EmptyState from '../design-system/compositions/EmptyState.svelte'

  let inputValue = $state('sample')
  let selectValue = $state('a')
  let checked = $state(true)
  let toggled = $state(false)
  let tab = $state('one')
</script>

<ScrollArea>
  <div class="page">
    <Cell>
      <Stack gap="4">
        <header class="hero">
          <h1>Design System</h1>
          <p class="caption">Industrial Brutalist Grid UI — componentes de produção</p>
        </header>

        <section>
          <h2 class="section">Foundations</h2>
          <Grid cols={3}>
            <Cell>
              <Label text="Color" />
              <div class="swatches">
                <div class="swatch" style="background:var(--color-bg)"></div>
                <div class="swatch" style="background:var(--color-bg-elevated)"></div>
                <div class="swatch" style="background:var(--color-fg)"></div>
                <div class="swatch" style="background:var(--color-accent)"></div>
                <div class="swatch" style="background:var(--color-ok)"></div>
                <div class="swatch" style="background:var(--color-warn)"></div>
                <div class="swatch" style="background:var(--color-danger)"></div>
              </div>
            </Cell>
            <Cell>
              <Label text="Typography" />
              <div class="type-sample">ABCDEF 012345</div>
              <div class="caption">IBM Plex Mono · uppercase labels</div>
            </Cell>
            <Cell>
              <Label text="Spacing / Borders" />
              <div class="space-row">
                <span class="box s1"></span>
                <span class="box s2"></span>
                <span class="box s3"></span>
                <span class="box s4"></span>
              </div>
              <div class="caption">1px borders · radius 0 · modular grid</div>
            </Cell>
          </Grid>
        </section>

        <Divider />

        <section>
          <h2 class="section">Primitives</h2>
          <Grid cols={4}>
            <Cell>
              <Label text="Cell" />
              <Surface tone="elevated"><div class="pad-demo">compartment</div></Surface>
            </Cell>
            <Cell>
              <Label text="Divider" />
              <Divider />
            </Cell>
            <Cell>
              <Label text="Label" />
              <Label text="Field label" />
            </Cell>
            <Cell>
              <Label text="Icon" />
              <Stack direction="horizontal" gap="2">
                <Icon name="grid" />
                <Icon name="dash" />
                <Icon name="fabric" />
                <Icon name="palette" />
                <Icon name="link" />
                <Icon name="settings" />
                <Icon name="system" />
              </Stack>
            </Cell>
          </Grid>
        </section>

        <Divider />

        <section>
          <h2 class="section">Controls</h2>
          <Grid cols={3}>
            <Cell>
              <Label text="Button" />
              <Stack direction="horizontal" gap="2">
                <Button variant="primary">Primary</Button>
                <Button>Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button disabled>Disabled</Button>
              </Stack>
            </Cell>
            <Cell>
              <Label text="Input" />
              <Input bind:value={inputValue} placeholder="entrada" />
            </Cell>
            <Cell>
              <Label text="Select" />
              <Select
                bind:value={selectValue}
                options={[
                  { value: 'a', label: 'Option A' },
                  { value: 'b', label: 'Option B' }
                ]}
              />
            </Cell>
            <Cell>
              <Label text="Checkbox" />
              <Stack gap="2">
                <Checkbox bind:checked label="Enabled" />
                <Checkbox disabled label="Locked" />
              </Stack>
            </Cell>
            <Cell>
              <Label text="Toggle" />
              <Stack gap="2">
                <Toggle bind:checked={toggled} label="Toggle" />
                <Toggle disabled label="Locked" />
              </Stack>
            </Cell>
          </Grid>
        </section>

        <Divider />

        <section>
          <h2 class="section">Data Display</h2>
          <Grid cols={3}>
            <Cell>
              <Label text="Status" />
              <Stack gap="2">
                <Status label="OK" tone="ok" />
                <Status label="Warn" tone="warn" />
                <Status label="Danger" tone="danger" />
              </Stack>
            </Cell>
            <Cell>
              <Label text="Metric" />
              <Metric label="Throughput" value="128" unit="u/s" />
            </Cell>
            <Cell>
              <Label text="Badge" />
              <Stack direction="horizontal" gap="2">
                <Badge text="Draft" />
                <Badge text="Live" tone="ok" />
                <Badge text="Fail" tone="danger" />
              </Stack>
            </Cell>
            <Cell>
              <Label text="Progress" />
              <Progress value={62} label="Queue" />
            </Cell>
            <Cell>
              <Label text="Table" />
              <Table
                columns={[
                  { key: 'id', label: 'ID' },
                  { key: 'name', label: 'Name' }
                ]}
                rows={[
                  { id: '01', name: 'Cell A' },
                  { id: '02', name: 'Cell B' }
                ]}
              />
            </Cell>
          </Grid>
        </section>

        <Divider />

        <section>
          <h2 class="section">Layout</h2>
          <Stack gap="3">
            <Panel title="Panel">
              Conteúdo em compartimento rígido.
            </Panel>
            <SplitPane ratio="1fr 1fr">
              {#snippet left()}
                <Cell><div class="pad-demo">Left pane</div></Cell>
              {/snippet}
              {#snippet right()}
                <Cell><div class="pad-demo">Right pane</div></Cell>
              {/snippet}
            </SplitPane>
            <Grid cols={4}>
              <Cell><div class="pad-demo">G1</div></Cell>
              <Cell><div class="pad-demo">G2</div></Cell>
              <Cell><div class="pad-demo">G3</div></Cell>
              <Cell><div class="pad-demo">G4</div></Cell>
            </Grid>
          </Stack>
        </section>

        <Divider />

        <section>
          <h2 class="section">Navigation</h2>
          <div class="nav-demo">
            <Sidebar>
              <NavItem label="Item A" icon="dash" active />
              <NavItem label="Item B" icon="settings" />
            </Sidebar>
            <div class="nav-main">
              <Topbar title="Topbar">
                <Status label="Online" tone="ok" />
              </Topbar>
              <Tabs
                tabs={[
                  { id: 'one', label: 'One' },
                  { id: 'two', label: 'Two' }
                ]}
                active={tab}
                onselect={(id) => (tab = id)}
              />
            </div>
          </div>
        </section>

        <Divider />

        <section>
          <h2 class="section">Compositions</h2>
          <Grid cols={2}>
            <Inspector title="Inspector">
              <Label text="Property" />
              <Input value="value" />
            </Inspector>
            <DataPanel
              title="Data Panel"
              columns={[
                { key: 'k', label: 'Key' },
                { key: 'v', label: 'Value' }
              ]}
              rows={[{ k: 'mode', v: 'grid' }]}
            />
            <MetricPanel
              title="Metric Panel"
              items={[
                { label: 'Open', value: '12' },
                { label: 'Done', value: '40' }
              ]}
            />
            <Panel title="Empty State">
              <EmptyState />
            </Panel>
          </Grid>
        </section>
      </Stack>
    </Cell>
  </div>
</ScrollArea>

<style>
  .page {
    max-width: 1100px;
  }

  .hero h1 {
    margin-bottom: var(--space-1);
  }

  .section {
    margin-bottom: var(--space-3);
    color: var(--color-fg-muted);
  }

  .swatches {
    display: flex;
    gap: 0;
  }

  .swatch {
    width: 28px;
    height: 28px;
    border: var(--border-width) solid var(--color-border-strong);
  }

  .type-sample {
    font-size: var(--text-lg);
    letter-spacing: var(--tracking-tight);
  }

  .space-row {
    display: flex;
    align-items: end;
    gap: var(--space-2);
  }

  .box {
    display: inline-block;
    border: var(--border-width) solid var(--color-border-strong);
    background: var(--color-bg-elevated);
  }

  .s1 {
    width: var(--space-1);
    height: var(--space-1);
  }
  .s2 {
    width: var(--space-2);
    height: var(--space-2);
  }
  .s3 {
    width: var(--space-3);
    height: var(--space-3);
  }
  .s4 {
    width: var(--space-4);
    height: var(--space-4);
  }

  .pad-demo {
    padding: var(--space-2);
    font-size: var(--text-xs);
    color: var(--color-fg-muted);
    letter-spacing: var(--tracking-label);
    text-transform: uppercase;
  }

  .nav-demo {
    display: grid;
    grid-template-columns: 220px 1fr;
    border: var(--border-width) solid var(--color-border);
    min-height: 160px;
  }

  .nav-main {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
</style>
