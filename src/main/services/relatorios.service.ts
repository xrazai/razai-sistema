import { getDb } from '../database/db'
import type {
  RelatorioFiltroInput,
  RelatorioKpis,
  VendaDiariaItem,
  RelatorioTecidoItem,
  RelatorioCorItem,
  RelatorioVendasTecidoCor
} from '../../shared/types'

type DbKpiRow = {
  faturamento_total: number | null
  quantidade_total: number | null
  total_vendas: number | null
}

type DbDiariaRow = {
  dia: string
  valor_total: number | null
  quantidade_total: number | null
  vendas_count: number | null
}

type DbItemAgrupadoRow = {
  tecido_id: string
  tecido_nome: string
  tecido_codigo: string
  cor_id: string
  cor_nome: string
  cor_codigo: string
  cor_hex: string | null
  quantidade_total: number | null
  valor_total: number | null
  itens_count: number | null
}

function normalizeDateStr(dateInput?: string): string | null {
  if (!dateInput || !dateInput.trim()) return null
  const trimmed = dateInput.trim()
  if (trimmed.length >= 10) {
    return trimmed.substring(0, 10)
  }
  return trimmed
}

function roundTwo(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export class RelatoriosService {
  static getKpis(filtro?: RelatorioFiltroInput): RelatorioKpis {
    const db = getDb()
    const dataInicio = normalizeDateStr(filtro?.dataInicio)
    const dataFim = normalizeDateStr(filtro?.dataFim)

    const row = db
      .prepare(`
        SELECT
          COALESCE(SUM(valor_total), 0) AS faturamento_total,
          COALESCE(SUM(quantidade_total), 0) AS quantidade_total,
          COUNT(id) AS total_vendas
        FROM vendas
        WHERE (? IS NULL OR date(created_at) >= date(?))
          AND (? IS NULL OR date(created_at) <= date(?))
      `)
      .get(dataInicio, dataInicio, dataFim, dataFim) as DbKpiRow | undefined

    const faturamentoTotal = Number(row?.faturamento_total || 0)
    const quantidadeTotalMetros = Number(row?.quantidade_total || 0)
    const totalVendas = Number(row?.total_vendas || 0)

    const ticketMedioVenda = totalVendas > 0 ? faturamentoTotal / totalVendas : 0
    const precoMedioMetro = quantidadeTotalMetros > 0 ? faturamentoTotal / quantidadeTotalMetros : 0

    return {
      faturamentoTotal: roundTwo(faturamentoTotal),
      quantidadeTotalMetros: roundTwo(quantidadeTotalMetros),
      totalVendas,
      ticketMedioVenda: roundTwo(ticketMedioVenda),
      precoMedioMetro: roundTwo(precoMedioMetro)
    }
  }

  static getVendasUltimos7Dias(): VendaDiariaItem[] {
    const db = getDb()
    const days: { data: string; label: string }[] = []

    const now = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)

      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const dataStr = `${year}-${month}-${day}`
      const labelStr = `${day}/${month}`

      days.push({ data: dataStr, label: labelStr })
    }

    const dataInicio = days[0].data

    const rows = db
      .prepare(`
        SELECT
          substr(created_at, 1, 10) AS dia,
          COALESCE(SUM(valor_total), 0) AS valor_total,
          COALESCE(SUM(quantidade_total), 0) AS quantidade_total,
          COUNT(id) AS vendas_count
        FROM vendas
        WHERE date(created_at) >= date(?)
        GROUP BY substr(created_at, 1, 10)
      `)
      .all(dataInicio) as DbDiariaRow[]

    const rowByDia = new Map<string, DbDiariaRow>()
    for (const r of rows) {
      if (r.dia) {
        rowByDia.set(r.dia, r)
      }
    }

    return days.map(({ data, label }) => {
      const found = rowByDia.get(data)
      return {
        data,
        label,
        valorTotal: roundTwo(Number(found?.valor_total || 0)),
        quantidadeTotal: roundTwo(Number(found?.quantidade_total || 0)),
        vendasCount: Number(found?.vendas_count || 0)
      }
    })
  }

  static getVendasPorTecidoCor(filtro?: RelatorioFiltroInput): RelatorioVendasTecidoCor {
    const db = getDb()
    const dataInicio = normalizeDateStr(filtro?.dataInicio)
    const dataFim = normalizeDateStr(filtro?.dataFim)

    const kpis = this.getKpis(filtro)

    const rows = db
      .prepare(`
        SELECT
          vi.tecido_id,
          vi.tecido_nome,
          vi.tecido_codigo,
          vi.cor_id,
          vi.cor_nome,
          vi.cor_codigo,
          vi.cor_hex,
          COALESCE(SUM(vi.quantidade), 0) AS quantidade_total,
          COALESCE(SUM(vi.subtotal), 0) AS valor_total,
          COUNT(vi.id) AS itens_count
        FROM venda_itens vi
        JOIN vendas v ON v.id = vi.venda_id
        WHERE (? IS NULL OR date(v.created_at) >= date(?))
          AND (? IS NULL OR date(v.created_at) <= date(?))
        GROUP BY vi.tecido_id, vi.cor_id
        ORDER BY vi.tecido_nome ASC, vi.cor_nome ASC
      `)
      .all(dataInicio, dataInicio, dataFim, dataFim) as DbItemAgrupadoRow[]

    // Agrupa por tecido
    const tecidosMap = new Map<
      string,
      {
        tecidoId: string
        tecidoNome: string
        tecidoCodigo: string
        rawCores: {
          corId: string
          corNome: string
          corCodigo: string
          corHex?: string
          quantidadeTotal: number
          valorTotal: number
        }[]
      }
    >()

    for (const row of rows) {
      const tId = String(row.tecido_id)
      let tGroup = tecidosMap.get(tId)
      if (!tGroup) {
        tGroup = {
          tecidoId: tId,
          tecidoNome: String(row.tecido_nome),
          tecidoCodigo: String(row.tecido_codigo),
          rawCores: []
        }
        tecidosMap.set(tId, tGroup)
      }

      tGroup.rawCores.push({
        corId: String(row.cor_id),
        corNome: String(row.cor_nome),
        corCodigo: String(row.cor_codigo),
        corHex: row.cor_hex || undefined,
        quantidadeTotal: Number(row.quantidade_total || 0),
        valorTotal: Number(row.valor_total || 0)
      })
    }

    const tecidos: RelatorioTecidoItem[] = []

    for (const tGroup of tecidosMap.values()) {
      let tecidoQuantidadeTotal = 0
      let tecidoValorTotal = 0

      for (const c of tGroup.rawCores) {
        tecidoQuantidadeTotal += c.quantidadeTotal
        tecidoValorTotal += c.valorTotal
      }

      const cores: RelatorioCorItem[] = tGroup.rawCores.map((c) => {
        const precoMedio = c.quantidadeTotal > 0 ? c.valorTotal / c.quantidadeTotal : 0
        const percentualTecido = tecidoValorTotal > 0 ? (c.valorTotal / tecidoValorTotal) * 100 : 0
        const percentualGeral = kpis.faturamentoTotal > 0 ? (c.valorTotal / kpis.faturamentoTotal) * 100 : 0

        return {
          corId: c.corId,
          corNome: c.corNome,
          corCodigo: c.corCodigo,
          corHex: c.corHex,
          quantidadeTotal: roundTwo(c.quantidadeTotal),
          valorTotal: roundTwo(c.valorTotal),
          precoMedio: roundTwo(precoMedio),
          percentualTecido: roundTwo(percentualTecido),
          percentualGeral: roundTwo(percentualGeral)
        }
      })

      // Ordena cores pelo maior valor total faturado
      cores.sort((a, b) => b.valorTotal - a.valorTotal)

      const precoMedioTecido = tecidoQuantidadeTotal > 0 ? tecidoValorTotal / tecidoQuantidadeTotal : 0
      const percentualGeralTecido =
        kpis.faturamentoTotal > 0 ? (tecidoValorTotal / kpis.faturamentoTotal) * 100 : 0

      tecidos.push({
        tecidoId: tGroup.tecidoId,
        tecidoNome: tGroup.tecidoNome,
        tecidoCodigo: tGroup.tecidoCodigo,
        quantidadeTotal: roundTwo(tecidoQuantidadeTotal),
        valorTotal: roundTwo(tecidoValorTotal),
        precoMedio: roundTwo(precoMedioTecido),
        percentualGeral: roundTwo(percentualGeralTecido),
        cores
      })
    }

    // Ordena tecidos pelo maior valor total faturado
    tecidos.sort((a, b) => b.valorTotal - a.valorTotal)

    return {
      kpis,
      dataInicio: dataInicio || undefined,
      dataFim: dataFim || undefined,
      tecidos
    }
  }
}
