import { getDb } from '../../database/db'
import type { AgenteRecord, AgenteConhecimentoRecord } from '../../../shared/types'
import { AgentesService } from './agentes.service'

export interface BuiltContext {
  systemPrompt: string
  knowledgeSnippets: string[]
  relevantSources: string[]
}

export class ContextBuilder {
  static build(agenteId: string, pergunta: string): BuiltContext {
    const agente = AgentesService.getById(agenteId)
    if (!agente) {
      throw new Error(`Agente com ID ${agenteId} não encontrado.`)
    }

    const conhecimentos = AgentesService.listConhecimentos(agenteId).filter((c) => c.ativo)

    const normalizedPergunta = pergunta.toLowerCase().trim()
    const terms = normalizedPergunta.split(/\s+/).filter((t) => t.length > 2)

    const scoredConhecimentos = conhecimentos.map((c) => {
      let score = 0
      const normTitulo = c.titulo.toLowerCase()
      const normConteudo = c.conteudo.toLowerCase()

      for (const term of terms) {
        if (normTitulo.includes(term)) score += 3
        if (normConteudo.includes(term)) score += 1
      }

      // Políticas e regras gerais sempre têm score base
      if (c.tipo === 'politica') score += 0.5

      return {
        item: c,
        score
      }
    })

    // Ordena pelo score decrescente
    scoredConhecimentos.sort((a, b) => b.score - a.score)

    const faqs: AgenteConhecimentoRecord[] = []
    const politicas: AgenteConhecimentoRecord[] = []
    const manuais: AgenteConhecimentoRecord[] = []
    const documentos: AgenteConhecimentoRecord[] = []
    const relevantSources: string[] = []

    for (const sc of scoredConhecimentos) {
      if (sc.score > 0 || sc.item.tipo === 'politica') {
        relevantSources.push(sc.item.titulo)
      }

      if (sc.item.tipo === 'faq') faqs.push(sc.item)
      else if (sc.item.tipo === 'politica') politicas.push(sc.item)
      else if (sc.item.tipo === 'manual_produto') manuais.push(sc.item)
      else documentos.push(sc.item)
    }

    const sections: string[] = []

    // 1. Identidade & Regras Principais
    sections.push(`[INSTRUÇÕES DO SISTEMA E IDENTIDADE]\n${agente.promptSistema || 'Você é um atendente útil e educado.'}`)

    // 2. Políticas da Loja
    if (politicas.length > 0) {
      const polText = politicas.map((p) => `- ${p.titulo}: ${p.conteudo}`).join('\n')
      sections.push(`[POLÍTICAS DA LOJA]\n${polText}`)
    }

    // 3. Manuais e Características
    if (manuais.length > 0) {
      const manText = manuais.map((m) => `### ${m.titulo}\n${m.conteudo}`).join('\n\n')
      sections.push(`[MANUAIS E ESPECIFICAÇÕES DE PRODUTOS]\n${manText}`)
    }

    // 4. FAQs
    if (faqs.length > 0) {
      const faqText = faqs.map((f) => `P: ${f.titulo}\nR: ${f.conteudo}`).join('\n\n')
      sections.push(`[PERGUNTAS FREQUENTES (FAQ)]\n${faqText}`)
    }

    // 5. Outros Documentos
    if (documentos.length > 0) {
      const docText = documentos.map((d) => `### ${d.titulo}\n${d.conteudo}`).join('\n\n')
      sections.push(`[DOCUMENTOS E REGRAS ADICIONAIS]\n${docText}`)
    }

    sections.push(
      `[DIRETRIZES DE RESPOSTA]\n` +
      `- Responda à dúvida do cliente de forma concisa, educada e direta.\n` +
      `- Baseie-se APENAS nas informações fornecidas acima.\n` +
      `- Se a informação não constar no conhecimento da loja, oriente o cliente a aguardar o retorno de um atendente humano.\n` +
      `- Não invente dados sobre prazos ou condições que não estejam listados nas regras.`
    )

    return {
      systemPrompt: sections.join('\n\n---\n\n'),
      knowledgeSnippets: sections,
      relevantSources
    }
  }
}
