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
  import Table, { type Column } from '../design-system/data-display/Table.svelte'
  import Sidebar from '../design-system/navigation/Sidebar.svelte'
  import Topbar from '../design-system/navigation/Topbar.svelte'
  import Tabs from '../design-system/navigation/Tabs.svelte'
  import NavItem from '../design-system/navigation/NavItem.svelte'
  import Breadcrumb from '../design-system/navigation/Breadcrumb.svelte'
  import Inspector from '../design-system/compositions/Inspector.svelte'
  import DataPanel from '../design-system/compositions/DataPanel.svelte'
  import MetricPanel from '../design-system/compositions/MetricPanel.svelte'
  import EmptyState from '../design-system/compositions/EmptyState.svelte'

  // Control state
  let inputValue = $state('Texto de entrada')
  let inputPrefixValue = $state('450,00')
  let inputSuffixValue = $state('1,50')
  let selectValue = $state('opt-a')
  let checkedA = $state(true)
  let checkedB = $state(false)
  let toggledA = $state(true)
  let toggledB = $state(false)
  let tab = $state('geral')
  let progressVal = $state(68)
  let breadcrumbStep = $state('detalhes')

  // Form playground state
  let demoNome = $state('Tricoline Lisa 100% Algodão')
  let demoComposicao = $state('100% Algodão')
  let demoLargura = $state('1,50')
  let demoRendimento = $state('5,50')
  let demoGramaturaLin = $state('180')
  let demoGramaturaM2 = $state('120')
  let demoTipo = $state('liso')
  let demoTransparencia = $state('nenhuma')
  let demoElasticidade = $state('nenhuma')
  let demoAcabamento = $state('fosco')

  // Table demo columns & rows
  const demoColumns: Column[] = [
    { key: 'codigo', label: 'SKU', width: '90px' },
    { key: 'nome', label: 'Nome' },
    { key: 'largura', label: 'Largura', width: '110px', align: 'right' },
    { key: 'rendimento', label: 'Rendimento', width: '130px', align: 'right' },
    { key: 'status', label: 'Status', width: '110px', align: 'center' }
  ]

  const demoRows = [
    { id: '1', codigo: 'TRAL', nome: 'Tricoline Lisa 100% Algodão', largura: '1,50 m', rendimento: '5,50 m/kg', status: 'ok' },
    { id: '2', codigo: 'CETI', nome: 'Cetim Especial', largura: '1,50 m', rendimento: '6,50 m/kg', status: 'warn' },
    { id: '3', codigo: 'ANAR', nome: 'Anarruga Estampada', largura: '1,40 m', rendimento: '4,50 m/kg', status: 'neutral' },
    { id: '4', codigo: 'LIRU', nome: 'Linho Puro Rústico', largura: '1,45 m', rendimento: '3,00 m/kg', status: 'info' }
  ]

  const iconsList = [
    'grid',
    'dash',
    'fabric',
    'palette',
    'link',
    'plus',
    'search',
    'settings',
    'system',
    'chevron',
    'chevron-left',
    'arrow-left',
    'check',
    'empty'
  ]
</script>

<ScrollArea>
  <div class="page">
    <Cell>
      <Stack gap="4">
        <!-- Hero Header -->
        <header class="hero">
          <h1>Design System</h1>
          <p class="caption">Industrial Brutalist Grid UI — Catálogo e Fonte de Verdade Visual dos Componentes Reais</p>
        </header>

        <!-- 01. Foundations -->
        <section>
          <h2 class="section">01. Foundations</h2>
          <Grid cols={3}>
            <Cell>
              <Label text="Paleta de Cores (Tokens CSS)" />
              <div class="swatches-grid">
                <div class="swatch-item"><div class="swatch" style="background:var(--color-bg)"></div><span>bg</span></div>
                <div class="swatch-item"><div class="swatch" style="background:var(--color-bg-elevated)"></div><span>elevated</span></div>
                <div class="swatch-item"><div class="swatch" style="background:var(--color-bg-sunken)"></div><span>sunken</span></div>
                <div class="swatch-item"><div class="swatch" style="background:var(--color-fg)"></div><span>fg</span></div>
                <div class="swatch-item"><div class="swatch" style="background:var(--color-fg-muted)"></div><span>muted</span></div>
                <div class="swatch-item"><div class="swatch" style="background:var(--color-fg-dim)"></div><span>dim</span></div>
                <div class="swatch-item"><div class="swatch" style="background:var(--color-border)"></div><span>border</span></div>
                <div class="swatch-item"><div class="swatch" style="background:var(--color-border-strong)"></div><span>b-strong</span></div>
                <div class="swatch-item"><div class="swatch" style="background:var(--color-accent)"></div><span>accent</span></div>
                <div class="swatch-item"><div class="swatch" style="background:var(--color-ok)"></div><span>ok</span></div>
                <div class="swatch-item"><div class="swatch" style="background:var(--color-warn)"></div><span>warn</span></div>
                <div class="swatch-item"><div class="swatch" style="background:var(--color-danger)"></div><span>danger</span></div>
                <div class="swatch-item"><div class="swatch" style="background:var(--color-info)"></div><span>info</span></div>
              </div>
            </Cell>
            <Cell>
              <Label text="Escala Tipográfica (IBM Plex Mono)" />
              <div class="type-scale">
                <div class="type-item t-xl">Text XL (18px) — TECIDOS / CATÁLOGO</div>
                <div class="type-item t-lg">Text LG (15px) — SKU: TRAL-01</div>
                <div class="type-item t-md">Text MD (13px) — Títulos de Painéis</div>
                <div class="type-item t-sm">Text SM (12px) — Dados de Células e Botões</div>
                <div class="type-item t-xs">Text XS (11px) — LABELS, STATUS E BADGES</div>
              </div>
            </Cell>
            <Cell>
              <Label text="Espaçamentos e Bordas" />
              <div class="space-row">
                <div class="space-block"><span class="box s1"></span><span>4px (1)</span></div>
                <div class="space-block"><span class="box s2"></span><span>8px (2)</span></div>
                <div class="space-block"><span class="box s3"></span><span>12px (3)</span></div>
                <div class="space-block"><span class="box s4"></span><span>16px (4)</span></div>
                <div class="space-block"><span class="box s5"></span><span>24px (5)</span></div>
              </div>
              <div class="caption">Bordas sólidas 1px · border-radius: 0 · Grid modular rígido</div>
            </Cell>
          </Grid>
        </section>

        <Divider />

        <!-- 02. Primitives -->
        <section>
          <h2 class="section">02. Primitives</h2>
          <Grid cols={4}>
            <Cell>
              <Label text="Cell & Surface (Tones)" />
              <Stack gap="2">
                <Surface tone="default"><div class="pad-demo">Surface: Default</div></Surface>
                <Surface tone="elevated"><div class="pad-demo">Surface: Elevated</div></Surface>
                <Surface tone="sunken"><div class="pad-demo">Surface: Sunken</div></Surface>
              </Stack>
            </Cell>
            <Cell>
              <Label text="Dividers (Horizontal & Vertical)" />
              <Stack gap="3">
                <span class="caption">Horizontal:</span>
                <Divider />
                <span class="caption">Vertical (entre compartimentos):</span>
                <div class="v-divider-demo">
                  <span>Bloco A</span>
                  <Divider orientation="vertical" />
                  <span>Bloco B</span>
                  <Divider orientation="vertical" />
                  <span>Bloco C</span>
                </div>
              </Stack>
            </Cell>
            <Cell>
              <Label text="Labels (Campos & Títulos)" />
              <Stack gap="2">
                <Label text="Label Padrão" />
                <Label text="Nome do Tecido *" for="demo-input" />
                <Label text="Gramatura Linear (g/m)" />
              </Stack>
            </Cell>
            <Cell>
              <Label text="Icons (SVG Monocromático 1px)" />
              <div class="icons-grid">
                {#each iconsList as iconName (iconName)}
                  <div class="icon-card" title={`Icon: ${iconName}`}>
                    <Icon name={iconName} />
                    <span class="icon-label">{iconName}</span>
                  </div>
                {/each}
              </div>
            </Cell>
          </Grid>
        </section>

        <Divider />

        <!-- 03. Controls -->
        <section>
          <h2 class="section">03. Controls</h2>
          <Grid cols={3}>
            <!-- Buttons -->
            <Cell>
              <Label text="Button (Variantes e Tamanhos)" />
              <Stack gap="3">
                <span class="caption">Tamanho MD (Padrão):</span>
                <Stack direction="horizontal" gap="2">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button disabled>Disabled</Button>
                </Stack>
                <span class="caption">Tamanho SM (Compacto / Toolbars):</span>
                <Stack direction="horizontal" gap="2">
                  <Button variant="primary" size="sm">
                    <Icon name="plus" size="sm" />
                    <span>Novo</span>
                  </Button>
                  <Button variant="secondary" size="sm">Ação SM</Button>
                  <Button variant="ghost" size="sm">
                    <Icon name="arrow-left" size="sm" />
                    <span>Voltar</span>
                  </Button>
                  <Button size="sm" disabled>Off</Button>
                </Stack>
              </Stack>
            </Cell>

            <!-- Inputs -->
            <Cell>
              <Label text="Input (Padrão, Prefix, Suffix, Disabled)" />
              <Stack gap="2">
                <Input bind:value={inputValue} placeholder="Texto simples..." />
                <Input bind:value={inputPrefixValue} prefix="R$" placeholder="0,00" />
                <Input bind:value={inputSuffixValue} suffix="m" placeholder="1,50" />
                <Input value="Campo Desabilitado" disabled suffix="g/m²" />
              </Stack>
            </Cell>

            <!-- Select, Checkbox, Toggle -->
            <Cell>
              <Label text="Select, Checkbox & Toggle" />
              <Stack gap="3">
                <Select
                  bind:value={selectValue}
                  options={[
                    { value: 'opt-a', label: 'Opção A — Padrão Liso' },
                    { value: 'opt-b', label: 'Opção B — Estampado' },
                    { value: 'opt-c', label: 'Opção C — Jacquard' }
                  ]}
                />
                <Select
                  disabled
                  options={[{ value: 'off', label: 'Select Desabilitado' }]}
                />
                <Divider />
                <Stack direction="horizontal" gap="4">
                  <Stack gap="1">
                    <Checkbox bind:checked={checkedA} label="Ativo" />
                    <Checkbox bind:checked={checkedB} label="Inativo" />
                    <Checkbox disabled checked={true} label="Travado" />
                  </Stack>
                  <Divider orientation="vertical" />
                  <Stack gap="1">
                    <Toggle bind:checked={toggledA} label="WAL Mode" />
                    <Toggle bind:checked={toggledB} label="Debug" />
                    <Toggle disabled checked={true} label="Auto-sync" />
                  </Stack>
                </Stack>
              </Stack>
            </Cell>
          </Grid>
        </section>

        <Divider />

        <!-- 04. Data Display -->
        <section>
          <h2 class="section">04. Data Display</h2>
          <Grid cols={3}>
            <!-- Status & Badges -->
            <Cell>
              <Label text="Status & Badges (Todos os Tones)" />
              <Stack gap="3">
                <span class="caption">Status Indicators:</span>
                <div class="wrap-row">
                  <Status label="OK / Conectado" tone="ok" />
                  <Status label="Aviso / Pendente" tone="warn" />
                  <Status label="Erro / Falha" tone="danger" />
                  <Status label="Info / Sync" tone="info" />
                  <Status label="Inativo" tone="neutral" />
                </div>
                <Divider />
                <span class="caption">Badges Técnicos:</span>
                <div class="wrap-row">
                  <Badge text="Ativo" tone="ok" />
                  <Badge text="Alerta" tone="warn" />
                  <Badge text="Erro 500" tone="danger" />
                  <Badge text="v0.1.0" tone="info" />
                  <Badge text="8 itens" tone="neutral" />
                </div>
              </Stack>
            </Cell>

            <!-- Metrics & Progress -->
            <Cell>
              <Label text="Metric & Progress" />
              <Stack gap="3">
                <Grid cols={2} bare>
                  <Cell pad={false}>
                    <Metric label="Rendimento Médio" value="5,50" unit="m/kg" />
                  </Cell>
                  <Cell pad={false}>
                    <Metric label="Gramatura" value="180" unit="g/m²" />
                  </Cell>
                </Grid>
                <Divider />
                <Progress value={progressVal} label="Ocupação do Armazém" />
                <Stack direction="horizontal" gap="2">
                  <Button size="sm" onclick={() => (progressVal = Math.max(0, progressVal - 15))}>-15%</Button>
                  <Button size="sm" onclick={() => (progressVal = Math.min(100, progressVal + 15))}>+15%</Button>
                </Stack>
              </Stack>
            </Cell>

            <!-- Table (com Ordenação Interativa) -->
            <Cell>
              <Label text="Table (Cabeçalhos Ordenáveis & Alinhamentos)" />
              <Table
                columns={demoColumns}
                rows={demoRows}
                bordered={true}
              >
                {#snippet cell({ column, value })}
                  {#if column.key === 'codigo'}
                    <span class="code-sku">{value}</span>
                  {:else if column.key === 'status'}
                    <Badge text={value} tone={value === 'ok' ? 'ok' : value === 'warn' ? 'warn' : value === 'info' ? 'info' : 'neutral'} />
                  {:else}
                    <span>{value}</span>
                  {/if}
                {/snippet}
              </Table>
            </Cell>
          </Grid>
        </section>

        <Divider />

        <!-- 05. Layout & Containers -->
        <section>
          <h2 class="section">05. Layout & Containers</h2>
          <Stack gap="3">
            <Panel title="Panel com Snippet de Ações no Cabeçalho">
              {#snippet actions()}
                <Stack direction="horizontal" gap="2">
                  <Button variant="ghost" size="sm">Exportar</Button>
                  <Button variant="primary" size="sm">
                    <Icon name="plus" size="sm" />
                    <span>Adicionar</span>
                  </Button>
                </Stack>
              {/snippet}
              <p>Estrutura rígida de painel com cabeçalho técnico padronizado e slot flexível de ações contextuais à direita.</p>
            </Panel>

            <Grid cols={2}>
              <Panel flush>
                {#snippet header()}
                  <Breadcrumb
                    items={[
                      { label: 'Tecidos', onclick: () => {} },
                      { label: 'Panel com Snippet Header (Breadcrumb)', active: true }
                    ]}
                  />
                {/snippet}
                <div class="pad-demo">
                  Painel com prop <code>flush</code> e cabeçalho customizado via snippet <code>header</code>.
                </div>
              </Panel>

              <SplitPane ratio="1fr 1fr">
                {#snippet left()}
                  <div class="pad-demo" style="background: var(--color-bg-sunken); height: 100%;">
                    SplitPane: Lado Esquerdo (50%)
                  </div>
                {/snippet}
                {#snippet right()}
                  <div class="pad-demo" style="background: var(--color-bg-elevated); height: 100%;">
                    SplitPane: Lado Direito (50%)
                  </div>
                {/snippet}
              </SplitPane>
            </Grid>
          </Stack>
        </section>

        <Divider />

        <!-- 06. Navigation Components -->
        <section>
          <h2 class="section">06. Navigation</h2>
          <div class="nav-demo">
            <Sidebar>
              <div class="demo-brand">RAZAI / DEMO</div>
              <Divider />
              <NavItem label="Tecidos" icon="fabric" active={breadcrumbStep === 'tecidos'} onclick={() => (breadcrumbStep = 'tecidos')} />
              <NavItem label="Cores" icon="palette" active={breadcrumbStep === 'cores'} onclick={() => (breadcrumbStep = 'cores')} />
              <NavItem label="Vínculos" icon="link" active={breadcrumbStep === 'vinculos'} onclick={() => (breadcrumbStep = 'vinculos')} />
              <Divider />
              <NavItem label="Configurações" icon="settings" active={breadcrumbStep === 'config'} onclick={() => (breadcrumbStep = 'config')} />
            </Sidebar>

            <div class="nav-main">
              <Topbar title="Módulo de Tecidos">
                <Status label="SQLite Online" tone="ok" />
              </Topbar>
              <Tabs
                tabs={[
                  { id: 'geral', label: 'Geral' },
                  { id: 'dimensoes', label: 'Dimensões' },
                  { id: 'acabamento', label: 'Acabamento' }
                ]}
                active={tab}
                onselect={(id) => (tab = id)}
              />
              <div class="breadcrumb-container">
                <Breadcrumb
                  items={[
                    { label: 'Catálogo', onclick: () => (breadcrumbStep = 'catalogo') },
                    { label: 'Tecidos Planos', onclick: () => (breadcrumbStep = 'planos') },
                    { label: 'TRAL — Tricoline Lisa', active: true }
                  ]}
                />
              </div>
              <div class="tab-content">
                <p>Conteúdo da aba ativa: <strong>{tab.toUpperCase()}</strong></p>
              </div>
            </div>
          </div>
        </section>

        <Divider />

        <!-- 07. Compositions -->
        <section>
          <h2 class="section">07. Compositions</h2>
          <Grid cols={4}>
            <Inspector title="Inspector Técnico">
              <Stack gap="2">
                <Label text="SKU Selecionado" />
                <Input value="TRAL" disabled />
                <Label text="Tipo de Fibras" />
                <Input value="100% Algodão Nobre" />
              </Stack>
            </Inspector>

            <DataPanel
              title="Propriedades Físicas"
              columns={[
                { key: 'param', label: 'Parâmetro' },
                { key: 'val', label: 'Valor' }
              ]}
              rows={[
                { param: 'Transparência', val: 'Nenhuma' },
                { param: 'Elasticidade', val: 'Nenhuma' },
                { param: 'Toque', val: 'Macio' }
              ]}
            />

            <MetricPanel
              title="Resumo do Rolo"
              items={[
                { label: 'Largura', value: '1,50', unit: 'm' },
                { label: 'Rendimento', value: '5,50', unit: 'm/kg' },
                { label: 'Gramatura', value: '180', unit: 'g/m' }
              ]}
            />

            <Panel title="Estado Vazio">
              <EmptyState
                title="Nenhum registro"
                description="Cadastre novos tecidos para visualizá-los aqui."
              />
            </Panel>
          </Grid>
        </section>

        <Divider />

        <!-- 08. Form & Field Playground (Grid Modular de Cadastro) -->
        <section>
          <h2 class="section">08. Form & Field Playground (Padrão Modular de Cadastro)</h2>
          <Panel title="Formulário Padrão em Grade Modular">
            {#snippet actions()}
              <Stack direction="horizontal" gap="2">
                <Button variant="ghost" size="sm">Limpar</Button>
                <Button variant="primary" size="sm">Salvar Registro</Button>
              </Stack>
            {/snippet}

            <Stack gap="3">
              <!-- Seção 1: Identificação Básica -->
              <div class="form-section">
                <div class="section-title">01. Identificação Básica (2 Colunas)</div>
                <Grid cols={2} bare>
                  <Cell pad={false}>
                    <div class="field-box">
                      <Label text="Nome *" for="demo-nome" />
                      <Input id="demo-nome" bind:value={demoNome} placeholder="Ex: Tricoline Lisa" />
                    </div>
                  </Cell>
                  <Cell pad={false}>
                    <div class="field-box">
                      <Label text="Composição *" for="demo-comp" />
                      <Input id="demo-comp" bind:value={demoComposicao} placeholder="Ex: 100% Algodão" />
                    </div>
                  </Cell>
                </Grid>
              </div>

              <!-- Seção 2: Dimensões e Rendimento com Auto-cálculo -->
              <div class="form-section">
                <div class="section-title">02. Dimensões e Rendimento (4 Colunas com Sufixos)</div>
                <Grid cols={4} bare>
                  <Cell pad={false}>
                    <div class="field-box">
                      <Label text="Largura (m) *" for="demo-larg" />
                      <Input id="demo-larg" bind:value={demoLargura} placeholder="1,50" suffix="m" />
                    </div>
                  </Cell>
                  <Cell pad={false}>
                    <div class="field-box">
                      <Label text="Rendimento (m/kg)" for="demo-rend" />
                      <Input id="demo-rend" bind:value={demoRendimento} placeholder="5,50" suffix="m/kg" />
                    </div>
                  </Cell>
                  <Cell pad={false}>
                    <div class="field-box">
                      <Label text="Gramatura Linear" for="demo-glin" />
                      <Input id="demo-glin" bind:value={demoGramaturaLin} placeholder="180" suffix="g/m" />
                    </div>
                  </Cell>
                  <Cell pad={false}>
                    <div class="field-box">
                      <Label text="Gramatura (g/m²)" for="demo-gm2" />
                      <Input id="demo-gm2" bind:value={demoGramaturaM2} placeholder="120" suffix="g/m²" />
                    </div>
                  </Cell>
                </Grid>
              </div>

              <!-- Seção 3: Classificações Técnicas -->
              <div class="form-section">
                <div class="section-title">03. Classificações e Acabamento (4 Colunas com Selects)</div>
                <Grid cols={4} bare>
                  <Cell pad={false}>
                    <div class="field-box">
                      <Label text="Tipo" for="demo-tipo" />
                      <Select
                        id="demo-tipo"
                        bind:value={demoTipo}
                        options={[
                          { value: 'liso', label: 'Liso' },
                          { value: 'estampado', label: 'Estampado' }
                        ]}
                      />
                    </div>
                  </Cell>
                  <Cell pad={false}>
                    <div class="field-box">
                      <Label text="Transparência" for="demo-transp" />
                      <Select
                        id="demo-transp"
                        bind:value={demoTransparencia}
                        options={[
                          { value: 'nenhuma', label: 'Nenhuma' },
                          { value: 'baixa', label: 'Baixa' },
                          { value: 'media', label: 'Média' },
                          { value: 'alta', label: 'Alta' }
                        ]}
                      />
                    </div>
                  </Cell>
                  <Cell pad={false}>
                    <div class="field-box">
                      <Label text="Elasticidade" for="demo-elast" />
                      <Select
                        id="demo-elast"
                        bind:value={demoElasticidade}
                        options={[
                          { value: 'nenhuma', label: 'Nenhuma' },
                          { value: 'baixa', label: 'Baixa' },
                          { value: 'media', label: 'Média' },
                          { value: 'alta', label: 'Alta' }
                        ]}
                      />
                    </div>
                  </Cell>
                  <Cell pad={false}>
                    <div class="field-box">
                      <Label text="Acabamento" for="demo-acab" />
                      <Select
                        id="demo-acab"
                        bind:value={demoAcabamento}
                        options={[
                          { value: 'fosco', label: 'Fosco' },
                          { value: 'semi_brilho', label: 'Semi-brilho' },
                          { value: 'brilhante', label: 'Brilhante' }
                        ]}
                      />
                    </div>
                  </Cell>
                </Grid>
              </div>
            </Stack>
          </Panel>
        </section>
      </Stack>
    </Cell>
  </div>
</ScrollArea>

<style>
  .page {
    width: 100%;
    padding-bottom: var(--space-6);
  }

  .hero {
    border-bottom: var(--border-width) solid var(--color-border);
    padding-bottom: var(--space-3);
  }

  .hero h1 {
    font-size: var(--text-xl);
    letter-spacing: var(--tracking-header);
    text-transform: uppercase;
    margin-bottom: var(--space-1);
    color: var(--color-fg);
  }

  .caption {
    font-size: var(--text-xs);
    color: var(--color-fg-muted);
    letter-spacing: var(--tracking-tight);
    font-family: var(--font-mono);
  }

  .section {
    font-size: var(--text-sm);
    letter-spacing: var(--tracking-header);
    text-transform: uppercase;
    margin-bottom: var(--space-3);
    color: var(--color-fg-muted);
  }

  .wrap-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  /* Foundations */
  .swatches-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-2);
    margin-top: var(--space-2);
  }

  .swatch-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .swatch {
    width: 100%;
    height: 24px;
    border: var(--border-width) solid var(--color-border-strong);
  }

  .swatch-item span {
    font-size: 9px;
    font-family: var(--font-mono);
    color: var(--color-fg-dim);
    text-transform: uppercase;
  }

  .type-scale {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    margin-top: var(--space-2);
  }

  .type-item {
    font-family: var(--font-mono);
    color: var(--color-fg);
    border-bottom: var(--border-width) solid var(--color-border);
    padding-bottom: 2px;
  }

  .t-xl { font-size: var(--text-xl); }
  .t-lg { font-size: var(--text-lg); }
  .t-md { font-size: var(--text-md); }
  .t-sm { font-size: var(--text-sm); }
  .t-xs { font-size: var(--text-xs); letter-spacing: var(--tracking-label); text-transform: uppercase; color: var(--color-fg-muted); }

  .space-row {
    display: flex;
    align-items: flex-end;
    gap: var(--space-2);
    margin-top: var(--space-2);
    margin-bottom: var(--space-2);
  }

  .space-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    font-size: 9px;
    font-family: var(--font-mono);
    color: var(--color-fg-dim);
  }

  .box {
    display: inline-block;
    border: var(--border-width) solid var(--color-border-strong);
    background: var(--color-bg-elevated);
  }

  .s1 { width: var(--space-1); height: var(--space-1); }
  .s2 { width: var(--space-2); height: var(--space-2); }
  .s3 { width: var(--space-3); height: var(--space-3); }
  .s4 { width: var(--space-4); height: var(--space-4); }
  .s5 { width: var(--space-5); height: var(--space-5); }

  /* Primitives */
  .pad-demo {
    padding: var(--space-2) var(--space-3);
    font-size: var(--text-xs);
    color: var(--color-fg-muted);
    letter-spacing: var(--tracking-label);
    text-transform: uppercase;
    font-family: var(--font-mono);
  }

  .v-divider-demo {
    display: flex;
    align-items: center;
    height: 32px;
    gap: var(--space-2);
    background: var(--color-bg-sunken);
    padding: 0 var(--space-2);
    font-size: var(--text-xs);
    color: var(--color-fg-muted);
  }

  .icons-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-1);
    margin-top: var(--space-1);
  }

  .icon-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: var(--space-2) var(--space-1);
    background: var(--color-bg-sunken);
    border: var(--border-width) solid var(--color-border);
  }

  .icon-label {
    font-size: 9px;
    font-family: var(--font-mono);
    color: var(--color-fg-dim);
    letter-spacing: var(--tracking-tight);
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
    white-space: nowrap;
  }

  .code-sku {
    font-weight: 700;
    color: var(--color-accent);
    font-family: var(--font-mono);
    letter-spacing: var(--tracking-header);
  }

  /* Navigation demo */
  .nav-demo {
    display: grid;
    grid-template-columns: 200px 1fr;
    border: var(--border-width) solid var(--color-border);
    background: var(--color-bg);
  }

  .demo-brand {
    padding: var(--space-3);
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-header);
    text-transform: uppercase;
    color: var(--color-fg);
    font-family: var(--font-mono);
  }

  .nav-main {
    display: flex;
    flex-direction: column;
    min-height: 200px;
  }

  .breadcrumb-container {
    padding: var(--space-2) var(--space-3);
    background: var(--color-bg);
    border-bottom: var(--border-width) solid var(--color-border);
  }

  .tab-content {
    padding: var(--space-4);
    font-size: var(--text-xs);
    color: var(--color-fg-muted);
    font-family: var(--font-mono);
  }

  /* Form Playground */
  .form-section {
    display: flex;
    flex-direction: column;
    border: var(--border-width) solid var(--color-border);
  }

  .section-title {
    padding: var(--space-2) var(--space-3);
    background: var(--color-bg-elevated);
    border-bottom: var(--border-width) solid var(--color-border);
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-header);
    text-transform: uppercase;
    color: var(--color-fg-dim);
    font-family: var(--font-mono);
  }

  .field-box {
    padding: var(--space-3);
    background: var(--color-bg);
    box-sizing: border-box;
  }
</style>
