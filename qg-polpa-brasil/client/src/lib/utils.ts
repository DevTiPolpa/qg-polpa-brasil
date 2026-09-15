import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)
}

export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: decimals, minimumFractionDigits: decimals }).format(value)
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 }).format(value / 100)
}

// Moeda com centavos (R$ 1.234.567,89) — formatCurrency acima arredonda pro inteiro,
// usado nos cards antigos; esta é para tabelas que precisam do valor exato.
export function formatCurrencyExato(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
}

// Abreviação pra cards de KPI (R$ 124,84 mi) — sempre usar formatCurrencyExato no
// title/tooltip ao lado, pra não esconder o valor exato.
export function formatCurrencyAbrev(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `R$ ${(value / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 2, minimumFractionDigits: 2 })} mi`
  if (abs >= 1_000) return `R$ ${(value / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} mil`
  return formatCurrencyExato(value)
}

const MES_ABREV = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export function formatMes(yyyyMM: string): string {
  const [year, month] = yyyyMM.split('-')
  const m = parseInt(month) - 1
  const y = year.slice(2)
  return `${MES_ABREV[m] ?? month}/${y}`
}

export function formatKg(value: number | string | null | undefined): string {
  const n = Number(value ?? 0)
  return `${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg`
}

export function formatData(yyyyMmDd: string | null | undefined): string {
  if (!yyyyMmDd) return '-'
  const [year, month, day] = yyyyMmDd.split('-')
  if (!year || !month || !day) return yyyyMmDd
  return `${day}/${month}/${year}`
}

const TIPO_LABELS: Record<string, string> = {
  VENDA_FIRME: 'Venda Firme',
  FORECAST: 'Forecast',
  NOVO_PROJETO: 'Novo Projeto',
  DEVOLUCAO: 'Devoluções',
}

export function tipoReceitaLabel(tipo: string): string {
  return TIPO_LABELS[tipo] ?? tipo
}
