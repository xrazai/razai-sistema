import { formatMeters } from './normalizer'
import type { ShopeeEtiquetaItem } from '../../../shared/shopee-etiquetas'

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function generateCutPdfHtml(batchId: string, items: ShopeeEtiquetaItem[], emittedAt = new Date()): string {
  const collator = new Intl.Collator('pt-BR', { sensitivity: 'base' })
  const groups = new Map<string, Map<string, Array<{ mm: number; order: number }>>>()
  let stableOrder = 0
  for (const item of items) {
    if (!item.fabricName || !item.colorName || !item.cutMm || item.quantity < 1) continue
    if (!groups.has(item.fabricName)) groups.set(item.fabricName, new Map())
    const colors = groups.get(item.fabricName)!
    if (!colors.has(item.colorName)) colors.set(item.colorName, [])
    for (let unit = 0; unit < item.quantity; unit += 1) {
      colors.get(item.colorName)!.push({ mm: item.cutMm, order: stableOrder++ })
    }
  }
  const sections = [...groups.entries()]
    .sort(([a], [b]) => collator.compare(a, b))
    .map(([fabric, colors], sourceOrder) => `
      <section class="fabric-section" data-source-order="${sourceOrder}">
        <div class="fabric-title">${escapeHtml(fabric)}</div>
        <table>
          <thead><tr><th>Cor</th><th>Cortes (m) - maior para menor</th></tr></thead>
          <tbody>
            ${[...colors.entries()]
              .sort(([a], [b]) => collator.compare(a, b))
              .map(([color, cuts]) => {
                const formatted = cuts
                  .sort((a, b) => b.mm - a.mm || a.order - b.order)
                  .map((cut) => formatMeters(cut.mm))
                  .join(' &bull; ')
                return `<tr><td class="color">${escapeHtml(color)}</td><td class="cuts">${formatted}</td></tr>`
              }).join('')}
          </tbody>
        </table>
      </section>
    `).join('')
  const emitted = emittedAt.toLocaleString('pt-BR')
  return `<!DOCTYPE html>
    <html lang="pt-BR"><head><meta charset="UTF-8"><title>Mapa de Cortes Shopee</title>
    <style>
      @page { size: A4; margin: 0; }
      * { box-sizing: border-box; margin: 0; padding: 0; line-height: 1.2; }
      body { font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #000; background: #fff; -webkit-print-color-adjust: exact; }
      .pdf-page { display: flex; flex-direction: column; width: 210mm; height: 297mm; padding: 15mm 12mm; overflow: hidden; break-after: page; page-break-after: always; }
      .pdf-page:last-child { break-after: auto; page-break-after: auto; }
      .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; }
      .brand-block { min-height: 31px; }
      .brand, .document-title { font-size: 16px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; }
      .meta { margin-top: 2px; font-size: 8px; color: #444; letter-spacing: .5px; text-transform: uppercase; }
      .document { text-align: right; }
      .page-content, .section-staging { display: flex; flex-direction: column; gap: 14px; }
      .page-content { flex: 1 1 auto; min-height: 0; overflow: hidden; }
      .section-staging { position: absolute; left: -10000px; top: 0; width: 186mm; visibility: hidden; }
      .fabric-section { flex: 0 0 auto; width: 100%; break-inside: avoid; page-break-inside: avoid; }
      .fabric-title { border: 1px solid #000; border-bottom: 0; padding: 7px 8px; background: #e4e4e4; font-size: 12px; font-weight: 800; letter-spacing: .7px; text-transform: uppercase; }
      table { width: 100%; border-collapse: collapse; border: 1px solid #000; }
      th, td { border: 1px solid #000; padding: 7px 8px; text-align: left; vertical-align: top; }
      th { background: #f0f0f0; font-size: 9px; font-weight: 700; letter-spacing: .5px; text-transform: uppercase; }
      tr { break-inside: avoid; page-break-inside: avoid; }
      tbody td { padding: 10px 8px; font-size: 12px; font-weight: 800; text-transform: uppercase; vertical-align: middle; }
      .color { width: 31%; }
      .cuts { word-spacing: 2px; }
      .footer { flex: 0 0 auto; margin-top: 12px; padding-top: 6px; border-top: 1px dashed #666; font-size: 8px; color: #666; text-transform: uppercase; }
    </style></head><body>
      <template id="header-template"><header class="header"><div class="brand-block"><div class="brand">RAZAI / SISTEMA</div></div>
      <div class="document"><div class="document-title">Mapa de Cortes / Shopee</div><div class="meta">Lote ${escapeHtml(batchId.slice(0, 8).toUpperCase())} · Emissão ${escapeHtml(emitted)}</div></div></header></template>
      <template id="footer-template"><footer class="footer">Razai Sistema · Cortes individuais sem total acumulado</footer></template>
      <main id="pdf-pages"></main>
      <div id="section-staging" class="section-staging">${sections}</div>
      <script>
        (() => {
          const pagesHost = document.getElementById('pdf-pages')
          const staging = document.getElementById('section-staging')
          const headerTemplate = document.getElementById('header-template')
          const footerTemplate = document.getElementById('footer-template')
          const sections = Array.from(staging.querySelectorAll('.fabric-section'))
            .map((element) => ({
              element,
              sourceOrder: Number(element.dataset.sourceOrder),
              height: element.getBoundingClientRect().height
            }))
            .sort((a, b) => b.height - a.height || a.sourceOrder - b.sourceOrder)
          const pages = []

          const createPage = () => {
            const page = document.createElement('section')
            page.className = 'pdf-page'
            page.append(headerTemplate.content.cloneNode(true))
            const content = document.createElement('div')
            content.className = 'page-content'
            page.append(content)
            page.append(footerTemplate.content.cloneNode(true))
            pagesHost.append(page)
            const record = { page, content }
            pages.push(record)
            return record
          }

          const tryPlace = (page, section) => {
            page.content.append(section)
            if (page.content.scrollHeight <= page.content.clientHeight + 1) return true
            section.remove()
            return false
          }

          const fitOversizedSection = (page, section) => {
            page.content.append(section)
            let zoom = 1
            let attempts = 0
            while (page.content.scrollHeight > page.content.clientHeight + 1 && attempts < 12) {
              const fitRatio = page.content.clientHeight / page.content.scrollHeight
              zoom *= Math.min(0.95, fitRatio * 0.98)
              section.style.zoom = String(zoom)
              section.style.width = (100 / zoom) + '%'
              attempts += 1
            }
            section.dataset.compacted = zoom < 1 ? 'true' : 'false'
          }

          for (const entry of sections) {
            let placed = false
            for (const page of pages) {
              if (tryPlace(page, entry.element)) {
                placed = true
                break
              }
            }
            if (!placed) {
              const page = createPage()
              if (!tryPlace(page, entry.element)) fitOversizedSection(page, entry.element)
            }
          }

          if (pages.length === 0) createPage()
          staging.remove()
          headerTemplate.remove()
          footerTemplate.remove()
          document.documentElement.dataset.pdfLayout = 'ready'
        })()
      </script>
    </body></html>`
}
