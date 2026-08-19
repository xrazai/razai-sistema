import { ContextBuilder } from './ContextBuilder'
import { SettingsService } from '../settings.service'
import { logger } from '../../logger'
import type { AgenteGerarRespostaResult } from '../../../shared/types'

export class LLMProvider {
  static async generateResponse(
    agenteId: string,
    pergunta: string,
    _conversaId?: string
  ): Promise<AgenteGerarRespostaResult> {
    const context = ContextBuilder.build(agenteId, pergunta)

    // Verifica se há chave de API externa configurada (ex: OpenAI)
    const apiKey = SettingsService.get('openai_api_key')
    const apiUrl = SettingsService.get('openai_api_url') || 'https://api.openai.com/v1/chat/completions'
    const model = SettingsService.get('openai_model') || 'gpt-4o-mini'

    if (apiKey && apiKey.trim()) {
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey.trim()}`
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: context.systemPrompt },
              { role: 'user', content: pergunta }
            ],
            temperature: 0.3
          })
        })

        if (response.ok) {
          const data = (await response.json()) as any
          const reply = data.choices?.[0]?.message?.content
          if (reply) {
            return {
              resposta: reply.trim(),
              confianca: 0.95,
              fontes: context.relevantSources
            }
          }
        } else {
          logger.warn(`Falha na chamada da API LLM (${response.status}): ${await response.text()}`)
        }
      } catch (err: any) {
        logger.error('Erro de conexão com API externa de IA:', err)
      }
    }

    // Motor de Resposta Local / Semântico (Garante funcionamento mesmo sem API externa configurada)
    return this.generateLocalFallback(pergunta, context)
  }

  private static generateLocalFallback(
    pergunta: string,
    context: { systemPrompt: string; relevantSources: string[] }
  ): AgenteGerarRespostaResult {
    const normPergunta = pergunta.toLowerCase()

    // 1. Saudações comuns
    if (/^(ol[aá]|oi|bom dia|boa tarde|boa noite|oii|olaa)/i.test(normPergunta.trim())) {
      return {
        resposta:
          'Olá! Seja muito bem-vindo(a) à Loja Razai Tecidos. Como posso te ajudar com nossos tecidos e pedidos hoje?',
        confianca: 0.99,
        fontes: ['Saudação Padrão']
      }
    }

    // 2. Agradecimentos
    if (/^(obrigad[ao]|valeu|agradecid[ao]|muito obrigad[ao])/i.test(normPergunta.trim())) {
      return {
        resposta:
          'Nós que agradecemos pela preferência! Se precisar de mais alguma informação sobre nossos produtos, estamos sempre à disposição.',
        confianca: 0.99,
        fontes: ['Agradecimento']
      }
    }

    // 3. Resposta baseada nas fontes encontradas pelo ContextBuilder
    if (context.relevantSources.length > 0) {
      const mainSource = context.relevantSources[0]
      // Extrai trecho correspondente no system prompt
      const sourceIndex = context.systemPrompt.indexOf(mainSource)
      let snippet = ''
      if (sourceIndex !== -1) {
        const afterSource = context.systemPrompt.substring(sourceIndex + mainSource.length)
        const endLine = afterSource.indexOf('\n\n')
        snippet = (endLine !== -1 ? afterSource.substring(0, endLine) : afterSource)
          .replace(/^[:\-\s]+/, '')
          .trim()
      }

      if (snippet) {
        return {
          resposta: `Olá! Sobre sua dúvida (${mainSource}):\n\n${snippet}\n\nSe precisar de mais detalhes, estou à disposição!`,
          confianca: 0.85,
          fontes: context.relevantSources
        }
      }
    }

    // 4. Resposta padrão quando não há regra específica correspondente
    return {
      resposta:
        'Olá! Recebemos sua mensagem. Estou consultando nossa equipe técnica para lhe fornecer a informação exata. Em breve um de nossos atendentes dará continuidade ao seu atendimento!',
      confianca: 0.5,
      fontes: []
    }
  }
}
