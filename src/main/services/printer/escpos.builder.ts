/**
 * Gerador declarativo de comandos binários ESC/POS para impressoras térmicas (80mm / 48 colunas).
 * Otimizado para Gertec G250W e impressoras padrão ESC/POS.
 */

// Tabela de mapeamento rápido de caracteres acentuados PT-BR para CP850
const CP850_MAP: Record<string, number> = {
  'á': 0xa0, 'é': 0x82, 'í': 0xa1, 'ó': 0xa2, 'ú': 0xa3,
  'Á': 0xb5, 'É': 0x90, 'Í': 0xd6, 'Ó': 0xe0, 'Ú': 0xe9,
  'ã': 0xc6, 'õ': 0xe4, 'Ã': 0xc7, 'Õ': 0xe5,
  'â': 0x83, 'ê': 0x88, 'î': 0x8c, 'ô': 0x93, 'û': 0x96,
  'Â': 0xb6, 'Ê': 0xd2, 'Î': 0xd7, 'Ô': 0xe2, 'Û': 0xea,
  'à': 0x85, 'è': 0x8a, 'ì': 0x8d, 'ò': 0x95, 'ù': 0x97,
  'À': 0xb7, 'È': 0xd4, 'Ì': 0xd8, 'Ò': 0xe3, 'Ù': 0xeb,
  'ç': 0x87, 'Ç': 0x80,
  'ü': 0x81, 'Ü': 0x9a,
  '°': 0xf8, 'ª': 0xa6, 'º': 0xa7,
  '§': 0x15, '·': 0xfa
}

export type AlignMode = 'left' | 'center' | 'right'

export class EscPosBuilder {
  private buffer: number[] = []
  private readonly columns: number

  constructor(columns: number = 48) {
    this.columns = columns
  }

  /**
   * Inicializa a impressora com configurações padrão e seleciona página de código CP850.
   */
  init(): this {
    this.buffer.push(0x1b, 0x40) // ESC @ (Reset/Init)
    this.buffer.push(0x1b, 0x74, 0x02) // ESC t 2 (Code page CP850 Multilingual)
    return this
  }

  /**
   * Define o alinhamento do texto.
   */
  align(mode: AlignMode): this {
    const map: Record<AlignMode, number> = { left: 0, center: 1, right: 2 }
    this.buffer.push(0x1b, 0x61, map[mode])
    return this
  }

  /**
   * Ativa ou desativa negrito.
   */
  bold(enable = true): this {
    this.buffer.push(0x1b, 0x45, enable ? 1 : 0)
    return this
  }

  /**
   * Ativa ou desativa modo invertido (fundo preto, texto branco).
   */
  inverse(enable = true): this {
    this.buffer.push(0x1d, 0x42, enable ? 1 : 0)
    return this
  }

  /**
   * Define o tamanho do texto (1x a 4x altura e largura).
   */
  size(widthMultiplier = 1, heightMultiplier = 1): this {
    const w = Math.min(Math.max(widthMultiplier, 1), 4) - 1
    const h = Math.min(Math.max(heightMultiplier, 1), 4) - 1
    const n = (w << 4) | h
    this.buffer.push(0x1d, 0x21, n)
    return this
  }

  /**
   * Adiciona texto convertendo caracteres especiais para CP850.
   */
  text(str: string): this {
    for (let i = 0; i < str.length; i++) {
      const char = str[i]
      if (CP850_MAP[char] !== undefined) {
        this.buffer.push(CP850_MAP[char])
      } else {
        const code = char.charCodeAt(0)
        // Se for ASCII imprimível ou controle básico
        if (code < 128) {
          this.buffer.push(code)
        } else {
          // Fallback para caractere não mapeado
          this.buffer.push(0x3f) // '?'
        }
      }
    }
    return this
  }

  /**
   * Adiciona uma linha de texto com quebra de linha.
   */
  line(str = ''): this {
    if (str) this.text(str)
    this.buffer.push(0x0a)
    return this
  }

  /**
   * Avança n linhas de papel.
   */
  feed(lines = 1): this {
    this.buffer.push(0x1b, 0x64, Math.max(1, lines))
    return this
  }

  /**
   * Imprime uma linha divisora horizontal (ex: 48 traços em 80mm).
   */
  divider(char = '-'): this {
    const line = char.repeat(this.columns).slice(0, this.columns)
    return this.line(line)
  }

  /**
   * Imprime duas colunas justificadas (esquerda e direita) preenchendo o espaço central.
   */
  twoColumns(left: string, right: string): this {
    const space = this.columns - (left.length + right.length)
    if (space <= 0) {
      // Se não couber em uma linha, imprime em linhas separadas
      this.line(left)
      this.align('right').line(right).align('left')
    } else {
      this.line(left + ' '.repeat(space) + right)
    }
    return this
  }

  /**
   * Imprime uma linha de tabela de 4 colunas formatadas para 80mm (48 colunas).
   * Exemplo: [ITEM 20c] [QTD 6c] [UNIT 10c] [TOTAL 10c] = 46 + 2 espaços = 48c
   */
  table4Columns(col1: string, col2: string, col3: string, col4: string): this {
    const c1 = col1.slice(0, 18).padEnd(18)
    const c2 = col2.slice(0, 6).padStart(6)
    const c3 = col3.slice(0, 10).padStart(10)
    const c4 = col4.slice(0, 11).padStart(11)
    return this.line(`${c1} ${c2} ${c3} ${c4}`)
  }

  /**
   * Corta o papel (auto-cutter / guilhotina).
   */
  cut(partial = false): this {
    this.feed(3)
    // GS V m n (m = 66 -> corte parcial com avanço, 65 -> corte total)
    this.buffer.push(0x1d, 0x56, partial ? 0x42 : 0x41, 0x00)
    return this
  }

  /**
   * Pulso elétrico para abertura de gaveta de dinheiro (pino RJ11).
   */
  openDrawer(): this {
    this.buffer.push(0x1b, 0x70, 0x00, 0x19, 0xfa)
    return this
  }

  /**
   * Retorna o buffer binário resultante para envio à impressora.
   */
  toBuffer(): Buffer {
    return Buffer.from(this.buffer)
  }
}
