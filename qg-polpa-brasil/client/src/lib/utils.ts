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

const TIPO_LABELS: Record<string, string> = {
  VENDA_FIRME: 'Venda Firme',
  FORECAST: 'Forecast',
  NOVO_PROJETO: 'Novo Projeto',
  DEVOLUCAO: 'Devoluções',
}

export function tipoReceitaLabel(tipo: string): string {
  return TIPO_LABELS[tipo] ?? tipo
}
