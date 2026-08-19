function toPdfBytes(data: Uint8Array | ArrayBuffer | number[]): Uint8Array {
  if (data instanceof Uint8Array) return data
  if (data instanceof ArrayBuffer) return new Uint8Array(data)
  return Uint8Array.from(data)
}

function isShareAbort(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'name' in err && (err as { name: string }).name === 'AbortError'
}

export async function sharePedidoPdf(id: string): Promise<void> {
  if (typeof window === 'undefined' || !window.razai?.pedidos) {
    throw new Error('API de pedidos indisponível.')
  }

  const generated = await window.razai.pedidos.gerarPdf(id)
  if (!generated.ok || !generated.data || !generated.fileName) {
    throw new Error(generated.error || 'Falha ao gerar PDF.')
  }

  const bytes = toPdfBytes(generated.data)
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  const file = new File([copy], generated.fileName, { type: 'application/pdf' })
  const title = generated.title || generated.fileName

  try {
    if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title, text: title })
      return
    }
  } catch (err) {
    if (isShareAbort(err)) return
    console.warn('[pedidos] Web Share indisponível, usando helper nativo:', err)
  }

  if (!generated.filePath) {
    throw new Error('PDF gerado sem caminho para o compartilhamento nativo.')
  }

  const native = await window.razai.pedidos.abrirShareNativo(generated.filePath, title)
  if (!native.ok) {
    throw new Error(native.error || 'Falha ao abrir o compartilhamento nativo.')
  }
}
