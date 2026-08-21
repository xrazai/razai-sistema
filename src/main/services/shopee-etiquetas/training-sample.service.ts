import { app } from 'electron'
import { createHash } from 'node:crypto'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import sharp from 'sharp'
import { LocalOcrService } from './ocr.service'
import { ShopeeEtiquetasRepository } from './repository'
import { ShopeeEtiquetaSourcePreviewService } from './source-preview.service'

export function resolveTrainingSamplePath(userDataPath: string, imageHash: string): {
  directory: string
  absolutePath: string
  relativePath: string
} {
  if (!/^[a-f0-9]{64}$/.test(imageHash)) throw new Error('Hash de amostra inválido.')
  const root = path.resolve(userDataPath, 'shopee', 'etiquetas', 'treinamento')
  const directory = path.join(root, 'amostras')
  const absolutePath = path.join(directory, `${imageHash}.png`)
  return { directory, absolutePath, relativePath: path.join('amostras', `${imageHash}.png`) }
}

export class ShopeeEtiquetaTrainingSampleService {
  static async captureCorrectedItem(itemId: string): Promise<boolean> {
    const data = ShopeeEtiquetasRepository.getTrainingSampleData(itemId)
    if (!data) return false
    let preview
    try {
      preview = await ShopeeEtiquetaSourcePreviewService.getItemSourcePreview(itemId)
    } catch {
      return false
    }
    const crop = await sharp(Buffer.from(preview.imageBase64, 'base64'))
      .extract({
        left: preview.highlight.x,
        top: preview.highlight.y,
        width: preview.highlight.width,
        height: preview.highlight.height
      })
      .png()
      .toBuffer()
    const imageHash = createHash('sha256').update(crop).digest('hex')
    const samplePath = resolveTrainingSamplePath(app.getPath('userData'), imageHash)
    await fs.mkdir(samplePath.directory, { recursive: true })
    await fs.writeFile(samplePath.absolutePath, crop, { flag: 'wx' }).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== 'EEXIST') throw error
    })
    return ShopeeEtiquetasRepository.addTrainingSample({
      sourceItemId: itemId,
      documentHash: data.documentHash,
      pageOrder: data.pageOrder,
      rowOrder: data.rowOrder,
      imageHash,
      relativePath: samplePath.relativePath,
      ocrJson: JSON.stringify(data.ocr),
      groundTruthJson: JSON.stringify(data.groundTruth),
      modelVersion: await LocalOcrService.getModelVersion()
    })
  }
}
