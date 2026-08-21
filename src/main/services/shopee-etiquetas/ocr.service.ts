import { app } from 'electron'
import { createRequire } from 'node:module'
import { createHash } from 'node:crypto'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import sharp from 'sharp'
import { createScheduler, createWorker, OEM, PSM, type Scheduler } from 'tesseract.js'

export type OcrResult = {
  text: string
  tsv: string
  confidence: number
}

type ProgressListener = (progress: number, message: string) => void

const require = createRequire(import.meta.url)

function resolveLanguagePath(): string {
  if (app?.isPackaged) return path.join(process.resourcesPath, 'ocr')
  return path.join(path.dirname(require.resolve('@tesseract.js-data/por')), '4.0.0')
}

export class LocalOcrService {
  private static scheduler: Scheduler | null = null
  private static initializing: Promise<Scheduler> | null = null
  private static jobs = 0
  private static idleTimer: ReturnType<typeof setTimeout> | null = null
  private static listener: ProgressListener | null = null
  private static modelVersionValue: Promise<string> | null = null

  static setProgressListener(listener: ProgressListener | null): void {
    this.listener = listener
  }

  static async getModelVersion(): Promise<string> {
    if (!this.modelVersionValue) {
      this.modelVersionValue = fs.readFile(path.join(resolveLanguagePath(), 'por.traineddata.gz'))
        .then((buffer) => `por:${createHash('sha256').update(buffer).digest('hex')}`)
        .catch(() => 'por:unavailable')
    }
    return this.modelVersionValue
  }

  private static async getScheduler(): Promise<Scheduler> {
    if (this.scheduler) return this.scheduler
    if (this.initializing) return this.initializing
    this.initializing = (async () => {
      const scheduler = createScheduler()
      const langPath = resolveLanguagePath()
      for (let index = 0; index < 2; index += 1) {
        const worker = await createWorker('por', OEM.LSTM_ONLY, {
          langPath,
          gzip: true,
          cacheMethod: 'none',
          logger: (message) => {
            if (message.status === 'recognizing text') {
              this.listener?.(Math.round(message.progress * 100), 'Executando OCR local')
            }
          }
        })
        await worker.setParameters({
          tessedit_pageseg_mode: PSM.SPARSE_TEXT,
          preserve_interword_spaces: '1',
          user_defined_dpi: '203'
        })
        scheduler.addWorker(worker)
      }
      this.scheduler = scheduler
      this.initializing = null
      return scheduler
    })()
    return this.initializing
  }

  static async recognize(image: Buffer, _psm: PSM = PSM.SPARSE_TEXT): Promise<OcrResult> {
    const scheduler = await this.getScheduler()
    if (this.idleTimer) clearTimeout(this.idleTimer)
    const result = await scheduler.addJob(
      'recognize',
      image,
      {},
      { text: true, tsv: true, blocks: false }
    )
    this.jobs += 1
    this.idleTimer = setTimeout(() => void this.terminate(), 10 * 60 * 1000)
    if (this.jobs >= 200) await this.terminate()
    return {
      text: result.data.text ?? '',
      tsv: result.data.tsv ?? '',
      confidence: Number(result.data.confidence) || 0
    }
  }

  static async terminate(): Promise<void> {
    if (this.idleTimer) clearTimeout(this.idleTimer)
    this.idleTimer = null
    const scheduler = this.scheduler
    this.scheduler = null
    this.jobs = 0
    if (scheduler) await scheduler.terminate()
  }

  static async orientAndRecognize(image: Buffer): Promise<{ angle: number; image: Buffer; result: OcrResult }> {
    const angles = [0, 90, 180, 270]
    const previews = await Promise.all(
      angles.map((angle) => sharp(image).rotate(angle).resize({ width: 600, withoutEnlargement: true }).threshold(180).png().toBuffer())
    )
    const previewResults = await Promise.all(previews.map((preview) => this.recognize(preview)))
    const score = (result: OcrResult) => {
      const text = result.text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()
      const keywords = ['CHECKLIST', 'CARREGAMENTO', 'PRODUTO', 'VARIACAO', 'SKU', 'DESTINATARIO', 'REMETENTE', 'SHOPEE']
      return keywords.reduce((total, keyword) => total + (text.includes(keyword) ? 20 : 0), 0) + result.confidence
    }
    let best = 0
    for (let index = 1; index < previewResults.length; index += 1) {
      if (score(previewResults[index]) > score(previewResults[best])) best = index
    }
    const oriented = await sharp(image).rotate(angles[best]).threshold(180).png().toBuffer()
    const result = await this.recognize(oriented, PSM.SPARSE_TEXT)
    return { angle: angles[best], image: oriented, result }
  }
}
