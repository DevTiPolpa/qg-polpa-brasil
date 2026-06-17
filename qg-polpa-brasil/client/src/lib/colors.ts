// Fonte de verdade única para cores de tipo de receita no projeto inteiro
// VENDA FIRME = verde | FORECAST = amarelo | NOVO PROJETO = azul | DEVOLUCAO = vermelho

export const COLORS = {
  VENDA_FIRME:  '#4F9D6E',   // verde sóbrio (estilo corporate/Power BI)
  FORECAST:     '#D4A23A',   // dourado/âmbar sóbrio
  NOVO_PROJETO: '#4F7CAC',   // azul-aço sóbrio
  DEVOLUCAO:    '#C0504D',   // vermelho terracota sóbrio
  ORCAMENTO:    '#E0974B',   // laranja sóbrio
} as const

// Tailwind class equivalents (para className strings)
export const TAILWIND = {
  VENDA_FIRME:  { bg: 'bg-green-700',  text: 'text-green-600',  border: 'border-green-700',  dot: 'bg-green-700'  },
  FORECAST:     { bg: 'bg-yellow-600', text: 'text-yellow-600', border: 'border-yellow-600', dot: 'bg-yellow-600' },
  NOVO_PROJETO: { bg: 'bg-blue-500',   text: 'text-blue-400',   border: 'border-blue-500',   dot: 'bg-blue-400'   },
  DEVOLUCAO:    { bg: 'bg-red-500',    text: 'text-red-400',    border: 'border-red-500',    dot: 'bg-red-400'    },
} as const

// border-l-4 para os cards do Dashboard (formato Tailwind arbitrary value)
export const BORDER_L_COLOR: Record<string, string> = {
  VENDA_FIRME:  'border-l-[#4F9D6E]',
  FORECAST:     'border-l-[#D4A23A]',
  NOVO_PROJETO: 'border-l-[#4F7CAC]',
  DEVOLUCAO:    'border-l-[#C0504D]',
}

// Cor para uso em style={{ color/fill/stroke }} inline
export function colorByTipo(tipo: string): string {
  return COLORS[tipo as keyof typeof COLORS] ?? COLORS.VENDA_FIRME
}

// Label legível
export const TIPO_LABEL: Record<string, string> = {
  VENDA_FIRME:  'Venda Firme',
  FORECAST:     'Forecast',
  NOVO_PROJETO: 'Novo Projeto',
  DEVOLUCAO:    'Devoluções',
}
