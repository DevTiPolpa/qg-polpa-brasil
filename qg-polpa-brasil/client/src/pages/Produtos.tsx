import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { trpc } from '../lib/trpc'
import FiltrosGlobais, { type Filtros } from '../components/FiltrosGlobais'
import { formatCurrency, formatNumber, formatMes } from '../lib/utils'
import { Search } from 'lucide-react'

const DEFAULT_FILTROS: Filtros = { dataInicio: '2026-01-01', dataFim: '2026-12-31' }

export default function Produtos() {
  const [filtros, setFiltros] = useState<Filtros>(DEFAULT_FILTROS)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<number | null>(null)

  const { data: lista } = trpc.produtos.performance.useQuery(filtros)
  const { data: evolucao } = trpc.produtos.evolucao.useQuery({ codProduto: selected!, filtros }, { enabled: !!selected })

  const filtered = (lista ?? []).filter(p =>
    !search || (p.nomeProduto ?? '').toLowerCase().includes(search.toLowerCase()) || (p.grupoProduto ?? '').toLowerCase().includes(search.toLowerCase())
  )
  const selectedProd = lista?.find(p => p.codProduto === selected)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Por Produto</h1>
          <p className="text-slate-400 text-sm mt-0.5">Performance do mix de produtos</p>
        </div>
        <FiltrosGlobais filtros={filtros} onChange={setFiltros} />
      </div>

      {/* Banner filtros ativos */}
      {(() => {
        const DEFAULT_F: Filtros = { dataInicio: '2026-01-01', dataFim: '2026-12-31' }
        const badges: { label: string; onRemove: () => void }[] = []
        ;(filtros.mercados ?? []).forEach(v => badges.push({ label: `Mercado: ${v}`, onRemove: () => setFiltros(f => ({ ...f, mercados: (f.mercados ?? []).filter(x => x !== v) })) }))
        ;(filtros.vendedores ?? []).forEach(v => badges.push({ label: `Vendedor: ${v.replace(/^\d+ - /, '')}`, onRemove: () => setFiltros(f => ({ ...f, vendedores: (f.vendedores ?? []).filter(x => x !== v) })) }))
        ;(filtros.projetos ?? []).forEach(v => badges.push({ label: `Projeto: ${v}`, onRemove: () => setFiltros(f => ({ ...f, projetos: (f.projetos ?? []).filter(x => x !== v) })) }))
        ;(filtros.gruposProduto ?? []).forEach(v => badges.push({ label: `Grupo: ${v}`, onRemove: () => setFiltros(f => ({ ...f, gruposProduto: (f.gruposProduto ?? []).filter(x => x !== v) })) }))
        ;(filtros.tiposReceita ?? []).forEach(v => badges.push({ label: `Tipo: ${v}`, onRemove: () => setFiltros(f => ({ ...f, tiposReceita: (f.tiposReceita ?? []).filter(x => x !== v) })) }))
        const temData = filtros.dataInicio !== DEFAULT_F.dataInicio || filtros.dataFim !== DEFAULT_F.dataFim
        if (badges.length === 0 && !temData) return null
        return (
          <div className="flex items-center gap-2 flex-wrap rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest shrink-0">Filtros ativos</span>
            <div className="flex items-center gap-1.5 flex-wrap flex-1">
              {badges.map((b, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-700 text-[11px] text-slate-200">
                  {b.label}
                  <button onClick={b.onRemove} className="text-slate-400 hover:text-white ml-0.5 leading-none">×</button>
                </span>
              ))}
            </div>
            <button
              onClick={() => setFiltros(DEFAULT_F)}
              className="shrink-0 text-[11px] font-semibold text-red-400 hover:text-red-300 transition-colors border border-red-500/30 hover:border-red-400/50 rounded-md px-2.5 py-1"
            >
              Limpar tudo
            </button>
          </div>
        )
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Lista */}
        <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-700">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar produto..."
                className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-green-500"
              />
            </div>
          </div>
          <div className="divide-y divide-slate-700 overflow-y-auto max-h-[600px]">
            {filtered.slice(0, 60).map(p => {
              const maxFat = Number(lista?.[0]?.faturamento ?? 1)
              const pct = (Number(p.faturamento) / maxFat) * 100
              const isSelected = selected === p.codProduto
              return (
                <button
                  key={p.codProduto}
                  onClick={() => setSelected(isSelected ? null : p.codProduto)}
                  className={`w-full text-left p-4 hover:bg-slate-700 transition ${isSelected ? 'bg-green-900/20 border-l-2 border-green-500' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-white truncate max-w-[65%]">{p.nomeProduto ?? `Produto ${p.codProduto}`}</p>
                    <p className="text-sm font-semibold text-green-400 shrink-0">{formatCurrency(Number(p.faturamento))}</p>
                  </div>
                  <div className="h-1 bg-slate-700 rounded-full overflow-hidden mb-1">
                    <div className="h-full bg-green-600 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex gap-3 text-xs text-slate-400">
                    <span>{p.grupoProduto}</span>
                    <span>{formatNumber(Number(p.volume), 0)} kg</span>
                    <span>{p.clientes} clientes</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Detalhes */}
        <div className="lg:col-span-3 space-y-4">
          {selected && selectedProd ? (
            <>
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-white mb-1">{selectedProd.nomeProduto}</h2>
                <p className="text-xs text-slate-400 mb-4">{selectedProd.grupoProduto}</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <p className="text-xs text-slate-400">Faturamento</p>
                    <p className="text-base font-bold text-white mt-0.5">{formatCurrency(Number(selectedProd.faturamento))}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <p className="text-xs text-slate-400">Volume</p>
                    <p className="text-base font-bold text-white mt-0.5">{formatNumber(Number(selectedProd.volume), 0)} kg</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <p className="text-xs text-slate-400">Clientes</p>
                    <p className="text-base font-bold text-white mt-0.5">{selectedProd.clientes}</p>
                  </div>
                </div>
              </div>

              {evolucao && evolucao.length > 0 && (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                  <h2 className="text-sm font-semibold text-white mb-4">Evolução Mensal</h2>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={evolucao.map(r => ({ mes: formatMes(r.mes), Faturamento: Number(r.faturamento), Volume: Number(r.volume) }))}>
                      <XAxis dataKey="mes" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={50} />
                      <Tooltip contentStyle={{ background: '#0f1d30', border: '1px solid #1e3454', borderRadius: 8, fontSize: 12 }} formatter={(v: number) => formatCurrency(v)} labelStyle={{ color: '#f8fafc' }} />
                      <Bar dataKey="Faturamento" fill="#16a34a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          ) : (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 flex items-center justify-center">
              <p className="text-slate-400 text-sm">Selecione um produto para ver detalhes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
