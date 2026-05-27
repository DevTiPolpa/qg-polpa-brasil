// Fonte de verdade única para cores de tipo de receita no projeto inteiro
// VENDA FIRME = verde | FORECAST = amarelo | NOVO PROJETO = azul | DEVOLUCAO = vermelho
export const COLORS = {
    VENDA_FIRME: 'oklch(0.65 0.20 145)', // verde
    FORECAST: 'oklch(0.82 0.18 85)', // amarelo
    NOVO_PROJETO: 'oklch(0.62 0.18 250)', // azul
    DEVOLUCAO: 'oklch(0.65 0.22 25)', // vermelho
    ORCAMENTO: 'oklch(0.78 0.18 55)', // laranja/dourado
};
// Tailwind class equivalents (para className strings)
export const TAILWIND = {
    VENDA_FIRME: { bg: 'bg-green-500', text: 'text-green-400', border: 'border-green-500', dot: 'bg-green-500' },
    FORECAST: { bg: 'bg-yellow-400', text: 'text-yellow-400', border: 'border-yellow-400', dot: 'bg-yellow-400' },
    NOVO_PROJETO: { bg: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500', dot: 'bg-blue-400' },
    DEVOLUCAO: { bg: 'bg-red-500', text: 'text-red-400', border: 'border-red-500', dot: 'bg-red-400' },
};
// border-l-4 para os cards do Dashboard (formato Tailwind arbitrary value)
export const BORDER_L_COLOR = {
    VENDA_FIRME: 'border-l-[oklch(0.65_0.20_145)]',
    FORECAST: 'border-l-[oklch(0.82_0.18_85)]',
    NOVO_PROJETO: 'border-l-[oklch(0.62_0.18_250)]',
    DEVOLUCAO: 'border-l-[oklch(0.65_0.22_25)]',
};
// Cor para uso em style={{ color/fill/stroke }} inline
export function colorByTipo(tipo) {
    return COLORS[tipo] ?? COLORS.VENDA_FIRME;
}
// Label legível
export const TIPO_LABEL = {
    VENDA_FIRME: 'Venda Firme',
    FORECAST: 'Forecast',
    NOVO_PROJETO: 'Novo Projeto',
    DEVOLUCAO: 'Devoluções',
};
