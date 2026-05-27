// Fonte de verdade única para cores de tipo de receita no projeto inteiro
// VENDA FIRME = verde | FORECAST = amarelo | NOVO PROJETO = azul | DEVOLUCAO = vermelho

export const COLORS = {
  VENDA_FIRME:  'oklch(0.50 0.20 145)',   // verde escuro
  FORECAST:     'oklch(0.65 0.18 85)',     // amarelo escuro
  NOVO_PROJETO: 'oklch(0.50 0.18 250)',    // azul escuro
  DEVOLUCAO:    'oklch(0.65 0.22 25)',     // vermelho
  ORCAMENTO:    'oklch(0.78 0.18 55)',     // laranja/dourado
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
  VENDA_FIRME:  'border-l-[oklch(0.50_0.20_145)]',
  FORECAST:     'border-l-[oklch(0.65_0.18_85)]',
  NOVO_PROJETO: 'border-l-[oklch(0.50_0.18_250)]',
  DEVOLUCAO:    'border-l-[oklch(0.65_0.22_25)]',
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
