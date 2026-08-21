import { app, shell } from 'electron'
import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import * as path from 'node:path'
import { pathToFileURL } from 'node:url'
import { promisify } from 'node:util'
import type { ShopeeEtiquetaItem } from '../../../shared/shopee-etiquetas'
import { PdfService } from '../pdf/pdf.service'
import { generateCutPdfHtml } from './cut-pdf-html'

const execFileAsync = promisify(execFile)

function formatDateForFile(date: Date): string {
  const part = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${part(date.getMonth() + 1)}-${part(date.getDate())}_${part(date.getHours())}-${part(date.getMinutes())}`
}

export class CutPdfService {
  static generateHtml(batchId: string, items: ShopeeEtiquetaItem[], emittedAt = new Date()): string {
    return generateCutPdfHtml(batchId, items, emittedAt)
  }

  static async generate(batchId: string, items: ShopeeEtiquetaItem[]): Promise<string> {
    const now = new Date()
    const outputDir = path.join(app.getPath('userData'), 'shopee', 'etiquetas', batchId, 'resultado')
    const fileName = `Cortes_Shopee_${formatDateForFile(now)}_${batchId.slice(0, 8)}.pdf`
    const outputPath = path.join(outputDir, fileName)
    await PdfService.renderHtmlToPdf(this.generateHtml(batchId, items, now), outputPath)
    return outputPath
  }

  private static async findChrome(): Promise<string | null> {
    const candidates = [
      process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe') : '',
      process.env.PROGRAMFILES ? path.join(process.env.PROGRAMFILES, 'Google', 'Chrome', 'Application', 'chrome.exe') : '',
      process.env['PROGRAMFILES(X86)'] ? path.join(process.env['PROGRAMFILES(X86)'], 'Google', 'Chrome', 'Application', 'chrome.exe') : ''
    ].filter(Boolean)
    const installed = candidates.find((candidate) => existsSync(candidate))
    if (installed) return installed
    for (const registryKey of [
      'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome.exe',
      'HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome.exe'
    ]) {
      try {
        const { stdout } = await execFileAsync('reg.exe', ['query', registryKey, '/ve'], { windowsHide: true })
        const match = stdout.match(/REG_SZ\s+(.+chrome\.exe)\s*$/im)
        if (match && existsSync(match[1].trim())) return match[1].trim()
      } catch {
        // Chrome não foi encontrado nessa chave.
      }
    }
    return null
  }

  static async open(pdfPath: string): Promise<void> {
    const allowedRoot = path.resolve(app.getPath('userData'), 'shopee', 'etiquetas')
    const resolved = path.resolve(pdfPath)
    const relative = path.relative(allowedRoot, resolved)
    if (!relative || relative.startsWith('..') || path.isAbsolute(relative) || !resolved.toLowerCase().endsWith('.pdf') || !existsSync(resolved)) {
      throw new Error('Caminho de PDF inválido ou expirado.')
    }
    const chrome = await this.findChrome()
    if (chrome) {
      await execFileAsync(chrome, ['--new-tab', pathToFileURL(resolved).href], { windowsHide: true })
      return
    }
    const error = await shell.openPath(resolved)
    if (error) throw new Error(error)
  }
}
