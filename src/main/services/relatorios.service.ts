import { getDb } from '../database/db'
import type {
  RelatorioFiltroInput,
  RelatorioKpis,
  VendaDiariaItem,
  RelatorioTecidoItem,
  RelatorioCorItem,
  RelatorioVendasTecidoCor,
  PrevisibilidadeFiltroInput,
  PrevisibilidadeItem,
  PrevisibilidadeKpis,
  RelatorioPrevisibilidadeResult,
  CurvaAbc,
  PrevisibilidadeTendencia,
  ConfiancaForecast
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

type DbTransacaoItem = {
  tecido_id: string
  tecido_nome: string
  tecido_codigo: string
  cor_id: string
  cor_nome: string
  cor_codigo: string
  cor_hex: string | null
  sku: string
  quantidade: number
  subtotal: number
  preco_unitario: number
  venda_created_at: string
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

  static getPrevisibilidadeEstoque(filtro?: PrevisibilidadeFiltroInput): RelatorioPrevisibilidadeResult {
    const db = getDb()
    const horizonteDias = filtro?.horizonteDias || 30
    const filtroAbc = filtro?.curvaAbc && filtro.curvaAbc !== 'todas' ? filtro.curvaAbc : null
    const filtroTendencia = filtro?.tendencia && filtro.tendencia !== 'todas' ? filtro.tendencia : null
    const filtroBusca = filtro?.search ? filtro.search.trim().toLowerCase() : null

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
          vi.sku,
          vi.quantidade,
          vi.subtotal,
          vi.preco_unitario,
          v.created_at AS venda_created_at
        FROM venda_itens vi
        JOIN vendas v ON v.id = vi.venda_id
        ORDER BY v.created_at ASC
      `)
      .all() as DbTransacaoItem[]

    // Agrupa transações por SKU
    type SkuGroup = {
      tecidoId: string
      tecidoNome: string
      tecidoCodigo: string
      corId: string
      corNome: string
      corCodigo: string
      corHex?: string
      sku: string
      transacoes: {
        quantidade: number
        subtotal: number
        timestamp: number
        dateStr: string
      }[]
    }

    const skuGroupsMap = new Map<string, SkuGroup>()

    for (const r of rows) {
      const key = `${r.tecido_id}_${r.cor_id}`
      let group = skuGroupsMap.get(key)
      if (!group) {
        group = {
          tecidoId: String(r.tecido_id),
          tecidoNome: String(r.tecido_nome),
          tecidoCodigo: String(r.tecido_codigo),
          corId: String(r.cor_id),
          corNome: String(r.cor_nome),
          corCodigo: String(r.cor_codigo),
          corHex: r.cor_hex || undefined,
          sku: String(r.sku),
          transacoes: []
        }
        skuGroupsMap.set(key, group)
      }

      const dateObj = new Date(r.venda_created_at)
      group.transacoes.push({
        quantidade: Number(r.quantidade || 0),
        subtotal: Number(r.subtotal || 0),
        timestamp: dateObj.getTime(),
        dateStr: r.venda_created_at.substring(0, 10)
      })
    }

    // Calcula estatísticas preliminares e totais para a Curva ABC
    type SkuCalc = {
      group: SkuGroup
      totalVendidoMetros: number
      totalFaturado: number
      vendasCount: number
      precoMedioMetro: number
      taxaDiariaCroston: number
      intervaloMedioDias: number
      tamanhoMedioPedidoMetros: number
      tendencia: PrevisibilidadeTendencia
      variacaoPercentual: number
      confianca: ConfiancaForecast
    }

    const calcs: SkuCalc[] = []
    let volumeTotalGeral = 0

    const nowTimestamp = Date.now()
    const msPerDay = 1000 * 60 * 60 * 24

    for (const group of skuGroupsMap.values()) {
      const totalVendido = group.transacoes.reduce((acc, t) => acc + t.quantidade, 0)
      const totalFaturado = group.transacoes.reduce((acc, t) => acc + t.subtotal, 0)
      const vendasCount = group.transacoes.length
      const precoMedio = totalVendido > 0 ? totalFaturado / totalVendido : 0

      volumeTotalGeral += totalVendido

      // Algoritmo Croston-SBA (Syntetos-Boylan Approximation)
      let p_est = 15 // intervalo médio inicial padrão (dias)
      let z_est = totalVendido / vendasCount // tamanho médio inicial
      const alpha = 0.1 // fator de suavização padrão da literatura

      if (vendasCount === 1) {
        p_est = 15
        z_est = totalVendido
      } else {
        // Ordena por data
        const sorted = [...group.transacoes].sort((a, b) => a.timestamp - b.timestamp)
        z_est = sorted[0].quantidade
        const firstInterval = Math.max(1, Math.round((sorted[1].timestamp - sorted[0].timestamp) / msPerDay))
        p_est = firstInterval

        for (let i = 1; i < sorted.length; i++) {
          const interv = Math.max(1, Math.round((sorted[i].timestamp - sorted[i - 1].timestamp) / msPerDay))
          z_est = z_est + alpha * (sorted[i].quantidade - z_est)
          p_est = p_est + alpha * (interv - p_est)
        }
      }

      p_est = Math.max(1, p_est)
      // Fórmula Croston com fator SBA: (z / p) * (1 - alpha/2)
      const sbaFactor = 1 - alpha / 2 // ~0.95
      let taxaDiaria = (z_est / p_est) * sbaFactor

      // Análise de Momentum / Tendência (Vendas dos últimos 14 dias vs taxa normal)
      const cutoff14d = nowTimestamp - 14 * msPerDay
      const vendasRecentes = group.transacoes.filter((t) => t.timestamp >= cutoff14d)
      const volumeRecente14d = vendasRecentes.reduce((acc, t) => acc + t.quantidade, 0)
      const taxaRecenteDiaria = volumeRecente14d / 14

      let tendencia: PrevisibilidadeTendencia = 'estavel'
      let variacaoPercentual = 0

      if (taxaDiaria > 0 && volumeRecente14d > 0) {
        const razao = taxaRecenteDiaria / taxaDiaria
        variacaoPercentual = roundTwo((razao - 1) * 100)

        if (razao >= 1.15) {
          tendencia = 'alta'
        } else if (razao <= 0.85) {
          tendencia = 'queda'
        } else {
          tendencia = 'estavel'
        }
      }

      let confianca: ConfiancaForecast = 'preliminar'
      if (vendasCount >= 6) {
        confianca = 'alta'
      } else if (vendasCount >= 4) {
        confianca = 'media'
      } else if (vendasCount >= 2) {
        confianca = 'baixa'
      }

      calcs.push({
        group,
        totalVendidoMetros: roundTwo(totalVendido),
        totalFaturado: roundTwo(totalFaturado),
        vendasCount,
        precoMedioMetro: roundTwo(precoMedio),
        taxaDiariaCroston: roundTwo(taxaDiaria),
        intervaloMedioDias: roundTwo(p_est),
        tamanhoMedioPedidoMetros: roundTwo(z_est),
        tendencia,
        variacaoPercentual,
        confianca
      })
    }

    // Ordena por volume total decrescente para classificar na Curva ABC
    calcs.sort((a, b) => b.totalVendidoMetros - a.totalVendidoMetros)

    let acumulado = 0
    const rawItens: PrevisibilidadeItem[] = []

    for (const c of calcs) {
      acumulado += c.totalVendidoMetros
      const pctAcumulado = volumeTotalGeral > 0 ? (acumulado / volumeTotalGeral) * 100 : 0

      let curvaAbc: CurvaAbc = 'C'
      if (pctAcumulado <= 80) {
        curvaAbc = 'A'
      } else if (pctAcumulado <= 95) {
        curvaAbc = 'B'
      } else {
        curvaAbc = 'C'
      }

      // Ajusta projeção com pequeno peso de momentum da tendência
      let fatorTendencia = 1.0
      if (c.tendencia === 'alta') fatorTendencia = 1.1
      if (c.tendencia === 'queda') fatorTendencia = 0.9

      const demandaPrevistaMetros = roundTwo(c.taxaDiariaCroston * horizonteDias * fatorTendencia)
      const demandaPrevistaRolos = Math.max(1, Math.ceil(demandaPrevistaMetros / 50)) // rolos de 50m
      const valorPrevistoReposicao = roundTwo(demandaPrevistaMetros * c.precoMedioMetro)

      rawItens.push({
        tecidoId: c.group.tecidoId,
        tecidoNome: c.group.tecidoNome,
        tecidoCodigo: c.group.tecidoCodigo,
        corId: c.group.corId,
        corNome: c.group.corNome,
        corCodigo: c.group.corCodigo,
        corHex: c.group.corHex,
        sku: c.group.sku,
        totalVendidoMetros: c.totalVendidoMetros,
        totalFaturado: c.totalFaturado,
        vendasCount: c.vendasCount,
        precoMedioMetro: c.precoMedioMetro,
        intervaloMedioDias: c.intervaloMedioDias,
        tamanhoMedioPedidoMetros: c.tamanhoMedioPedidoMetros,
        taxaDiariaCroston: c.taxaDiariaCroston,
        tendencia: c.tendencia,
        variacaoPercentual: c.variacaoPercentual,
        curvaAbc,
        confianca: c.confianca,
        horizonteDias,
        demandaPrevistaMetros,
        demandaPrevistaRolos,
        valorPrevistoReposicao
      })
    }

    // Aplica filtros
    let filteredItens = rawItens
    if (filtroAbc) {
      filteredItens = filteredItens.filter((i) => i.curvaAbc === filtroAbc)
    }
    if (filtroTendencia) {
      filteredItens = filteredItens.filter((i) => i.tendencia === filtroTendencia)
    }
    if (filtroBusca) {
      filteredItens = filteredItens.filter(
        (i) =>
          i.tecidoNome.toLowerCase().includes(filtroBusca) ||
          i.tecidoCodigo.toLowerCase().includes(filtroBusca) ||
          i.corNome.toLowerCase().includes(filtroBusca) ||
          i.corCodigo.toLowerCase().includes(filtroBusca) ||
          i.sku.toLowerCase().includes(filtroBusca)
      )
    }

    // Calcula KPIs consolidados do resultado filtrado
    const demandaTotalProjetadaMetros = roundTwo(
      filteredItens.reduce((acc, i) => acc + i.demandaPrevistaMetros, 0)
    )
    const demandaTotalProjetadaRolos = filteredItens.reduce(
      (acc, i) => acc + i.demandaPrevistaRolos,
      0
    )
    const investimentoTotalReposicao = roundTwo(
      filteredItens.reduce((acc, i) => acc + i.valorPrevistoReposicao, 0)
    )
    const taxaMediaDiariaGeralMetros = roundTwo(
      filteredItens.reduce((acc, i) => acc + i.taxaDiariaCroston, 0)
    )
    const totalSkusEmAlta = filteredItens.filter((i) => i.tendencia === 'alta').length

    const kpis: PrevisibilidadeKpis = {
      horizonteDias,
      demandaTotalProjetadaMetros,
      demandaTotalProjetadaRolos,
      investimentoTotalReposicao,
      taxaMediaDiariaGeralMetros,
      totalSkusAnalisados: filteredItens.length,
      totalSkusEmAlta
    }

    return {
      kpis,
      itens: filteredItens,
      generatedAt: new Date().toISOString()
    }
  }
}
