import { ipcMain, app } from 'electron'
import { getDb } from '../database/db'
import { TecidosService } from '../services/tecidos.service'
import { CoresService } from '../services/cores.service'
import { VinculosService } from '../services/vinculos.service'
import { VendasService } from '../services/vendas.service'
import { PedidosService } from '../services/pedidos.service'
import { PdfService } from '../services/pdf/pdf.service'
import { SettingsService } from '../services/settings.service'
import { PrinterService } from '../services/printer/printer.service'
import { exportTecidosCsv, exportCoresCsv, exportDatabase } from '../services/backup.service'
import { DiagnosticsService } from '../services/diagnostics.service'
import { RelatoriosService } from '../services/relatorios.service'
import { checkForUpdates, quitAndInstall, getUpdateStatus } from '../updater'
import { logger } from '../logger'
import { ShopeeEtiquetasRepository } from '../services/shopee-etiquetas/repository'
import { ShopeeEtiquetasJobService } from '../services/shopee-etiquetas/job.service'
import { ZebraPrinterService } from '../services/shopee-etiquetas/zebra-printer.service'
import { ShopeeEtiquetaSourcePreviewService } from '../services/shopee-etiquetas/source-preview.service'
import { ShopeeEtiquetaTrainingSampleService } from '../services/shopee-etiquetas/training-sample.service'
import type {
  AppInfo,
  DbHealth,
  CreateTecidoInput,
  UpdateTecidoInput,
  CreateCorInput,
  UpdateCorInput,
  CreateVinculosInput,
  CreateVendaInput,
  CreatePedidoInput,
  UpdatePedidoInput,
  RelatorioFiltroInput,
  PrevisibilidadeFiltroInput
} from '../../shared/types'
import type { ShopeeEtiquetaCorrecaoInput, ShopeeEtiquetaEquivalenciaInput } from '../../shared/shopee-etiquetas'

export function registerIpcHandlers(): void {
  ipcMain.handle('app:getInfo', (): AppInfo => ({
    name: 'razai-sistema',
    version: app.getVersion()
  }))

  ipcMain.handle('db:health', (): DbHealth => {
    try {
      const row = getDb()
        .prepare(`SELECT value FROM app_meta WHERE key = 'schema_version'`)
        .get() as { value: string } | undefined

      return {
        ok: true,
        schemaVersion: row?.value ?? 'unknown',
        timestamp: new Date().toISOString()
      }
    } catch (err: any) {
      logger.error('Falha ao verificar saúde do banco', err)
      return {
        ok: false,
        schemaVersion: 'none',
        error: err?.message || 'Falha ao conectar com o banco de dados SQLite',
        timestamp: new Date().toISOString()
      }
    }
  })

  // Handlers para o CRUD de Tecidos
  ipcMain.handle('tecidos:list', (_event, search?: string) => {
    return TecidosService.list(search)
  })

  ipcMain.handle('tecidos:getById', (_event, id: string) => {
    return TecidosService.getById(id)
  })

  ipcMain.handle('tecidos:create', (_event, input: CreateTecidoInput) => {
    return TecidosService.create(input)
  })

  ipcMain.handle('tecidos:update', (_event, id: string, input: UpdateTecidoInput) => {
    return TecidosService.update(id, input)
  })

  ipcMain.handle('tecidos:delete', (_event, id: string) => {
    return TecidosService.delete(id)
  })

  // Handlers para o CRUD de Cores
  ipcMain.handle('cores:list', (_event, search?: string) => {
    return CoresService.list(search)
  })

  ipcMain.handle('cores:getById', (_event, id: string) => {
    return CoresService.getById(id)
  })

  ipcMain.handle('cores:create', (_event, input: CreateCorInput) => {
    return CoresService.create(input)
  })

  ipcMain.handle('cores:update', (_event, id: string, input: UpdateCorInput) => {
    return CoresService.update(id, input)
  })

  ipcMain.handle('cores:delete', (_event, id: string) => {
    return CoresService.delete(id)
  })

  // Handlers para Vínculos (Matriz Tecido-Cor)
  ipcMain.handle('vinculos:list', (_event, search?: string) => {
    return VinculosService.list(search)
  })

  ipcMain.handle('vinculos:listByTecido', (_event, tecidoId: string) => {
    return VinculosService.listByTecido(tecidoId)
  })

  ipcMain.handle('vinculos:createBatch', (_event, input: CreateVinculosInput) => {
    return VinculosService.createBatch(input)
  })

  ipcMain.handle('vinculos:delete', (_event, id: string) => {
    return VinculosService.delete(id)
  })

  ipcMain.handle('vinculos:deleteByTecidoAndCor', (_event, tecidoId: string, corId: string) => {
    return VinculosService.deleteByTecidoAndCor(tecidoId, corId)
  })

  // Handlers para Vendas
  ipcMain.handle('vendas:list', (_event, search?: string) => {
    return VendasService.list(search)
  })

  ipcMain.handle('vendas:getById', (_event, id: string) => {
    return VendasService.getById(id)
  })

  ipcMain.handle('vendas:create', (_event, input: CreateVendaInput) => {
    return VendasService.create(input)
  })

  ipcMain.handle('vendas:delete', (_event, id: string) => {
    return VendasService.delete(id)
  })

  ipcMain.handle('vendas:imprimirCupom', async (_event, vendaId: string, printerName?: string) => {
    const venda = VendasService.getById(vendaId)
    if (!venda) {
      return { ok: false, error: 'Venda não encontrada' }
    }
    return PrinterService.printSaleReceipt(venda, printerName)
  })

  // Handlers para Pedidos
  ipcMain.handle('pedidos:list', (_event, search?: string) => {
    return PedidosService.list(search)
  })

  ipcMain.handle('pedidos:getById', (_event, id: string) => {
    return PedidosService.getById(id)
  })

  ipcMain.handle('pedidos:create', (_event, input: CreatePedidoInput) => {
    return PedidosService.create(input)
  })

  ipcMain.handle('pedidos:update', (_event, id: string, input: UpdatePedidoInput) => {
    return PedidosService.update(id, input)
  })

  ipcMain.handle('pedidos:delete', (_event, id: string) => {
    return PedidosService.delete(id)
  })

  ipcMain.handle('pedidos:aprovar', (_event, id: string) => {
    return PedidosService.aprovar(id)
  })

  ipcMain.handle('pedidos:gerarPdf', async (_event, id: string) => {
    const pedido = PedidosService.getById(id)
    if (!pedido) {
      return { ok: false, error: 'Pedido não encontrado' }
    }
    return PdfService.generatePedidoPdf(pedido)
  })

  ipcMain.handle('pedidos:compartilhar', async (_event, id: string) => {
    const pedido = PedidosService.getById(id)
    if (!pedido) {
      return { ok: false, error: 'Pedido não encontrado' }
    }
    return PdfService.sharePedidoPdf(pedido)
  })

  ipcMain.handle('pedidos:abrirShareNativo', async (_event, filePath: string, title: string) => {
    if (typeof filePath !== 'string' || typeof title !== 'string') {
      return { ok: false, error: 'Parâmetros inválidos para compartilhamento.' }
    }
    return PdfService.openWindowsShare(filePath, title)
  })

  // Handlers para Preferências e Configurações (app_meta)
  ipcMain.handle('settings:get', (_event, key: string) => {
    return SettingsService.get(key)
  })

  ipcMain.handle('settings:set', (_event, key: string, value: string) => {
    return SettingsService.set(key, value)
  })

  ipcMain.handle('settings:getAll', () => {
    return SettingsService.getAll()
  })

  ipcMain.handle('settings:delete', (_event, key: string) => {
    return SettingsService.delete(key)
  })

  // Handlers para Impressão Térmica ESC/POS
  ipcMain.handle('printer:list', async () => {
    return PrinterService.listPrinters()
  })

  ipcMain.handle('printer:printTest', async (_event, printerName?: string) => {
    return PrinterService.printTestReceipt(printerName)
  })

  // Shopee / Etiquetas
  ipcMain.handle('shopee:etiquetas:import', async (_event, filePaths: string[]) => {
    return ShopeeEtiquetasJobService.importFiles(filePaths)
  })
  ipcMain.handle('shopee:etiquetas:list', () => ShopeeEtiquetasJobService.listBatches())
  ipcMain.handle('shopee:etiquetas:get', (_event, id: string) => ShopeeEtiquetasJobService.getBatch(id))
  ipcMain.handle('shopee:etiquetas:itemSourcePreview', (_event, itemId: string) =>
    ShopeeEtiquetaSourcePreviewService.getItemSourcePreview(itemId)
  )
  ipcMain.handle('shopee:etiquetas:delete', (_event, id: string) => ShopeeEtiquetasJobService.deleteBatch(id))
  ipcMain.handle('shopee:etiquetas:correctItem', async (_event, input: ShopeeEtiquetaCorrecaoInput) => {
    const batchId = ShopeeEtiquetasRepository.correctItem(input)
    if (batchId) await ShopeeEtiquetaTrainingSampleService.captureCorrectedItem(input.itemId).catch(() => false)
    return batchId ? ShopeeEtiquetasJobService.getBatch(batchId) : null
  })
  ipcMain.handle('shopee:etiquetas:resume', (_event, id: string) => ShopeeEtiquetasJobService.resumeBatch(id))
  ipcMain.handle('shopee:etiquetas:retryPrinting', (_event, id: string) => ShopeeEtiquetasJobService.retryPrinting(id))
  ipcMain.handle('shopee:etiquetas:confirmPrinted', (_event, id: string) => ShopeeEtiquetasJobService.confirmPrinted(id))
  ipcMain.handle('shopee:etiquetas:regeneratePdf', (_event, id: string) => ShopeeEtiquetasJobService.regeneratePdf(id))
  ipcMain.handle('shopee:etiquetas:openPdf', (_event, id: string) => ShopeeEtiquetasJobService.openPdf(id))
  ipcMain.handle('shopee:etiquetas:equivalences:list', () => ShopeeEtiquetasRepository.listEquivalences())
  ipcMain.handle('shopee:etiquetas:equivalences:save', (_event, input: ShopeeEtiquetaEquivalenciaInput) =>
    ShopeeEtiquetasRepository.saveEquivalence(input)
  )
  ipcMain.handle('shopee:etiquetas:equivalences:delete', (_event, id: string) => ShopeeEtiquetasRepository.deleteEquivalence(id))
  ipcMain.handle('shopee:etiquetas:learning:stats', () => ShopeeEtiquetasRepository.getLearningStats())
  ipcMain.handle('shopee:etiquetas:printers:list', () => PrinterService.listPrinters())
  ipcMain.handle('shopee:etiquetas:zebra:get', () => ZebraPrinterService.getPrinter())
  ipcMain.handle('shopee:etiquetas:zebra:set', (_event, name: string) => ZebraPrinterService.setPrinter(name))
  ipcMain.handle('shopee:etiquetas:zebra:test', (_event, name?: string) => ZebraPrinterService.test(name))

  // Handlers para Exportação CSV e Backup do Banco
  ipcMain.handle('backup:exportTecidosCsv', async (_event, filePath?: string) => {
    return exportTecidosCsv(filePath)
  })

  ipcMain.handle('backup:exportCoresCsv', async (_event, filePath?: string) => {
    return exportCoresCsv(filePath)
  })

  ipcMain.handle('backup:exportDatabase', async (_event, destinationPath?: string) => {
    return exportDatabase(destinationPath)
  })

  // Handlers para Diagnóstico e Logs do Sistema
  ipcMain.handle('diagnostics:getLogs', async (_event, limit?: number) => {
    return DiagnosticsService.getLogs(limit)
  })

  ipcMain.handle('diagnostics:clearLogs', async () => {
    return DiagnosticsService.clearLogs()
  })

  ipcMain.handle('diagnostics:getMetrics', async () => {
    return DiagnosticsService.getMetrics()
  })

  // Handlers para Relatórios e Inteligência de Vendas
  ipcMain.handle('relatorios:getKpis', async (_event, filtro?: RelatorioFiltroInput) => {
    return RelatoriosService.getKpis(filtro)
  })

  ipcMain.handle('relatorios:getVendasUltimos7Dias', async () => {
    return RelatoriosService.getVendasUltimos7Dias()
  })

  ipcMain.handle('relatorios:getVendasPorTecidoCor', async (_event, filtro?: RelatorioFiltroInput) => {
    return RelatoriosService.getVendasPorTecidoCor(filtro)
  })

  ipcMain.handle('relatorios:getPrevisibilidadeEstoque', async (_event, filtro?: PrevisibilidadeFiltroInput) => {
    return RelatoriosService.getPrevisibilidadeEstoque(filtro)
  })

  // Handlers para Atualizações Automáticas (electron-updater)
  ipcMain.handle('updater:check', async () => {
    return checkForUpdates()
  })

  ipcMain.handle('updater:install', async () => {
    return quitAndInstall()
  })

  ipcMain.handle('updater:getStatus', async () => {
    return getUpdateStatus()
  })

}
