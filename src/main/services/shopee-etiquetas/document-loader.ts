import * as path from 'node:path'
import * as fs from 'node:fs/promises'
import { createHash } from 'node:crypto'
import * as unzipper from 'unzipper'

export type LoadedZplDocument = {
  entryName: string
  buffer: Buffer
}

const allowedDocumentExtensions = new Set(['.zpl', '.txt'])

function assertSafeEntry(entryPath: string): void {
  const normalized = entryPath.replace(/\\/g, '/')
  if (
    normalized.startsWith('/') ||
    /^[a-z]:/i.test(normalized) ||
    normalized.split('/').some((part) => part === '..')
  ) {
    throw new Error(`Caminho inseguro dentro do ZIP: ${entryPath}`)
  }
}

export async function loadZplDocuments(filePath: string): Promise<LoadedZplDocument[]> {
  const extension = path.extname(filePath).toLowerCase()
  if (!['.zip', '.zpl', '.txt'].includes(extension)) {
    throw new Error(`Formato não suportado: ${path.basename(filePath)}`)
  }

  if (extension !== '.zip') {
    const buffer = await fs.readFile(filePath)
    if (!buffer.length) throw new Error(`Arquivo vazio: ${path.basename(filePath)}`)
    return [{ entryName: path.basename(filePath), buffer }]
  }

  const archive = await unzipper.Open.file(filePath)
  const documents: LoadedZplDocument[] = []
  let expandedBytes = 0
  for (const entry of archive.files) {
    if (entry.type === 'Directory') continue
    assertSafeEntry(entry.path)
    if ((entry.flags & 0x1) !== 0) throw new Error(`ZIP criptografado não é aceito: ${entry.path}`)
    const entryExtension = path.extname(entry.path).toLowerCase()
    if (entryExtension === '.zip') throw new Error(`ZIP aninhado não é aceito: ${entry.path}`)
    if (!allowedDocumentExtensions.has(entryExtension)) {
      if (!entry.path.replace(/\\/g, '/').startsWith('__MACOSX/')) continue
    } else {
      expandedBytes += entry.uncompressedSize
      if (expandedBytes > 250 * 1024 * 1024) throw new Error('O lote excede 250 MB descompactados.')
      const buffer = await entry.buffer()
      if (buffer.length) documents.push({ entryName: entry.path, buffer })
    }
  }
  if (!documents.length) throw new Error(`Nenhum documento ZPL foi encontrado em ${path.basename(filePath)}.`)
  return documents
}

export async function loadExactZplDocument(
  storedPath: string,
  entryName: string,
  expectedHash: string
): Promise<Buffer> {
  let documents: LoadedZplDocument[]
  try {
    documents = await loadZplDocuments(storedPath)
  } catch (error: any) {
    if (error?.code === 'ENOENT') throw new Error('O arquivo original expirou ou não está disponível.', { cause: error })
    throw error
  }
  const document = documents.find((candidate) => candidate.entryName === entryName)
  if (!document) throw new Error(`Documento original não encontrado: ${entryName}`)
  const hash = createHash('sha256').update(document.buffer).digest('hex')
  if (hash !== expectedHash) throw new Error('O documento original foi alterado desde a importação.')
  return document.buffer
}
