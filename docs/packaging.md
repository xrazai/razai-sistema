# Guia de Empacotamento e Distribuição (Windows)

Este documento descreve o fluxo de empacotamento, compilação de módulos nativos C++ (`better-sqlite3`), configuração do `electron-builder` e o checklist de **Smoke Test** para validação dos executáveis gerados do **Razai Sistema**.

---

## 1. Visão Geral

O empacotamento do Razai Sistema utiliza a combinação de **electron-vite** (para bundle do processo Main, Preload e Renderer Svelte 5) e **electron-builder** (para montagem dos artefatos executáveis e instaladores para Windows x64).

### Artefatos Gerados:
- **Instalador NSIS (`.exe`)**: Instalador assistido configurável (atalhos no desktop e menu iniciar).
- **Executável Portátil (`Portable .exe`)**: Executável único autocontido sem necessidade de instalação prévia.
- **Diretório Descompactado (`dist/win-unpacked`)**: Binário montado para inspeção e testes rápidos locais sem passar pelo instalador.

---

## 2. Dependências Nativas (`better-sqlite3`)

O `better-sqlite3` é um módulo nativo C++ compilado via `node-gyp`. No ambiente Electron, a versão da ABI do Node interno do Electron difere do Node do sistema operacional.

O `electron-builder` cuida automaticamente da reconstrução do módulo para a versão do Electron em uso através do `@electron/rebuild`.

### Configuração ASAR (`electron-builder.yml`):
Para garantir que o arquivo binário nativo (`better_sqlite3.node`) seja acessado corretamente em runtime:
```yaml
asar: true
asarUnpack:
  - "**/*.node"
```
Isso descompacta os binários `.node` para fora do arquivo `app.asar`, permitindo que o processo Node.js/Electron carregue a biblioteca dinâmica C++ sem erros.

---

## 3. Caminhos de Dados e Persistência em Produção

Em modo de desenvolvimento ou empacotado, o banco SQLite segue o padrão:
- **Produção / Empacotado**: `%APPDATA%\razai-sistema\data\razai.sqlite` (obtido via `app.getPath('userData')`).
- **Override para Testes / CI**: Variável de ambiente `RAZAI_DB_PATH`.

No startup da aplicação (`src/main/database/db.ts`):
1. O diretório de dados é criado automaticamente caso não exista (`mkdirSync(dir, { recursive: true })`).
2. Conexão SQLite é aberta com modo WAL (`db.pragma('journal_mode = WAL')`) e foreign keys ativadas.
3. As migrations versionadas (`src/main/database/migrations`) são executadas em ordem de versão idempotente.

---

## 4. Scripts de Build e Empacotamento

No `package.json`:

| Comando | Descrição |
|---|---|
| `npm run build` | Compila o código TypeScript, Main, Preload e Svelte para a pasta `out/`. |
| `npm run package:win` | Compila o app e gera o executável descompactado em `dist/win-unpacked/` (ideal para smoke test rápido). |
| `npm run build:win` | Compila e empacota os instaladores finais NSIS e Portable na pasta `dist/`. |
| `npm run postinstall` | Executa `electron-builder install-app-deps` para sincronizar os headers nativos locais. |

---

## 5. Passo a Passo para Gerar os Binários Localmente

1. **Garantir dependências instaladas**:
   ```powershell
   npm install
   ```

2. **Validação de tipos e testes unitários**:
   ```powershell
   npm run typecheck
   npm run test
   ```

3. **Geração do pacote descompactado para validação rápida**:
   ```powershell
   npm run package:win
   ```
   O executável estará em `dist/win-unpacked/Razai Sistema.exe`.

4. **Geração dos instaladores completos (NSIS / Portable)**:
   ```powershell
   npm run build:win
   ```
   Os artefatos estarão em `dist/`.

---

## 6. Checklist de Smoke Test (Validação Pré-Release)

Após gerar o pacote via `npm run package:win` ou `npm run build:win`, execute o seguinte roteiro de smoke test no Windows:

- [ ] **1. Inicialização da Aplicação**:
  - Executar `dist/win-unpacked/Razai Sistema.exe`.
  - A janela principal deve abrir sem tela branca (White Screen of Death) ou travamento.
  - O tema escuro industrial brutalist deve ser renderizado corretamente.

- [ ] **2. Inicialização do Banco de Dados SQLite**:
  - Verificar se o arquivo de banco foi criado em `%APPDATA%\razai-sistema\data\razai.sqlite`.
  - Confirmar que as migrations foram aplicadas (tabelas `schema_migrations`, `tecidos`, `cores`, etc. presentes).

- [ ] **3. Operações CRUD — Módulo de Tecidos**:
  - Navegar até o módulo de **Tecidos**.
  - Cadastrar um novo tecido com composição e gramatura.
  - Verificar a listagem e os cálculos de rendimento.
  - Editar e excluir um registro para confirmar a integridade das transações SQLite.

- [ ] **4. Operações CRUD — Módulo de Cores**:
  - Navegar até o módulo de **Cores**.
  - Cadastrar uma cor com swatch hexadecimal / RGB / Pantone.
  - Filtrar e buscar na lista.

- [ ] **5. Persistência e Fechamento**:
  - Fechar a aplicação (`Alt+F4` ou botão fechar).
  - Reabrir o executável e confirmar que os dados cadastrados persistem intactos.
  - Verificar se nenhum processo zumbi do Electron permanece ativo no Gerenciador de Tarefas.

---

## 7. Resolução de Problemas Comuns

### Erro: `The module '...better_sqlite3.node' was compiled against a different Node.js version`
- **Causa**: O módulo nativo foi compilado com o Node do sistema em vez dos headers do Electron.
- **Solução**: Execute `npx electron-builder install-app-deps` ou rode novamente `npm run package:win`.

### Erro: `EPERM: operation not permitted` no `dist/`
- **Causa**: Uma instância anterior do `Razai Sistema.exe` ainda está aberta e bloqueando a sobrescrita dos arquivos na pasta `dist/`.
- **Solução**: Feche o processo no Gerenciador de Tarefas e repita o comando de build.
