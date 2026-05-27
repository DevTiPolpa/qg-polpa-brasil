import { useState, useMemo } from 'react'
import { trpc } from '../lib/trpc'
import { formatCurrency } from '../lib/utils'
import { Target, Plus, Trash2, Save, X } from 'lucide-react'

const MESES = [
  { value: '01', label: 'Jan' }, { value: '02', label: 'Fev' },
  { value: '03', label: 'Mar' }, { value: '04', label: 'Abr' },
  { value: '05', label: 'Mai' }, { value: '06', label: 'Jun' },
  { value: '07', label: 'Jul' }, { value: '08', label: 'Ago' },
  { value: '09', label: 'Set' }, { value: '10', label: 'Out' },
  { value: '11', label: 'Nov' }, { value: '12', label: 'Dez' },
]

const ANO = '2026'

interface FormState {
  nomeVendedor: string
  mes: string
  valorMeta: string
  projeto: string
}

const FORM_VAZIO: FormState = { nomeVendedor: '', mes: '01', valorMeta: '', projeto: '' }

export default function Metas() {
  const utils = trpc.useUtils()
  const { data: metas, isLoading } = trpc.metas2026.list.useQuery()
  const { data: filtros } = trpc.filtros.disponiveis.useQuery()
  const upsertMutation = trpc.metas2026.upsert.useMutation({ onSuccess: () => { utils.metas2026.list.invalidate(); setForm(FORM_VAZIO); setEditando(false) } })
  const deleteMutation = trpc.metas2026.delete.useMutation({ onSuccess: () => utils.metas2026.list.invalidate() })

  const [form, setForm] = useState<FormState>(FORM_VAZIO)
  const [editando, setEditando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const vendedores = useMemo(() => filtros?.vendedores ?? [], [filtros])

  // Agrupa metas por vendedor
  const porVendedor = useMemo(() => {
    if (!metas) return []
    const map = new Map<string, typeof metas>()
    for (const m of metas) {
      const arr = map.get(m.nomeVendedor) ?? []
      arr.push(m)
      map.set(m.nomeVendedor, arr)
    }
    return Array.from(map.entries()).map(([nome, lista]) => ({
      nome,
      total: lista.reduce((s, m) => s + m.valorMeta, 0),
      metas: lista.sort((a, b) => a.mes.localeCompare(b.mes)),
    })).sort((a, b) => b.total - a.total)
  }, [metas])

  function handleSalvar() {
    setErro(null)
    if (!form.nomeVendedor) return setErro('Selecione um vendedor.')
    const valor = parseFloat(form.valorMeta.replace(/\./g, '').replace(',', '.'))
    if (isNaN(valor) || valor < 0) return setErro('Informe um valor de meta válido.')
    upsertMutation.mutate({
      nomeVendedor: form.nomeVendedor,
      mes: `${ANO}-${form.mes}`,
      valorMeta: valor,
      projeto: form.projeto || null,
    })
  }

  function handleEditar(m: { nomeVendedor: string; mes: string; valorMeta: number; projeto: string | null }) {
    setForm({
      nomeVendedor: m.nomeVendedor,
      mes: m.mes.split('-')[1],
      valorMeta: String(m.valorMeta),
      projeto: m.projeto ?? '',
    })
    setEditando(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="space-y-6 p-1">
      <div className="flex items-center gap-3">
        <Target className="w-5 h-5 text-green-400" />
        <h1 className="text-lg font-bold text-white">Metas por Vendedor — {ANO}</h1>
      </div>

      {/* Formulário */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          {editando ? <><Save className="w-4 h-4" /> Editar Meta</> : <><Plus className="w-4 h-4" /> Nova Meta</>}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Vendedor */}
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Vendedor</label>
            <select
              value={form.nomeVendedor}
              onChange={e => setForm(f => ({ ...f, nomeVendedor: e.target.value }))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="">Selecione...</option>
              {vendedores.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          {/* Mês */}
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Mês</label>
            <select
              value={form.mes}
              onChange={e => setForm(f => ({ ...f, mes: e.target.value }))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              {MESES.map(m => <option key={m.value} value={m.value}>{m.label}/{ANO}</option>)}
            </select>
          </div>

          {/* Valor Meta */}
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Valor da Meta (R$)</label>
            <input
              type="number"
              min={0}
              step={1000}
              placeholder="ex: 500000"
              value={form.valorMeta}
              onChange={e => setForm(f => ({ ...f, valorMeta: e.target.value }))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          {/* Projeto */}
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Projeto <span className="text-slate-500">(opcional)</span></label>
            <input
              type="text"
              placeholder="ex: RECORRENTES"
              value={form.projeto}
              onChange={e => setForm(f => ({ ...f, projeto: e.target.value }))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
        </div>

        {erro && <p className="text-red-400 text-xs mt-3">{erro}</p>}

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSalvar}
            disabled={upsertMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {upsertMutation.isPending ? 'Salvando...' : 'Salvar Meta'}
          </button>
          {editando && (
            <button
              onClick={() => { setForm(FORM_VAZIO); setEditando(false) }}
              className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white text-sm rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Cancelar
            </button>
          )}
        </div>
      </div>

      {/* Tabela de metas */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Metas Cadastradas</h2>
          {metas && <span className="text-xs text-slate-400">{metas.length} registro{metas.length !== 1 ? 's' : ''}</span>}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-slate-400 text-sm">Carregando...</div>
        ) : !metas || metas.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-slate-500 text-sm">Nenhuma meta cadastrada ainda.</div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {porVendedor.map(({ nome, total, metas: lista }) => (
              <div key={nome}>
                {/* Cabeçalho do vendedor */}
                <div className="px-5 py-2.5 bg-slate-700/30 flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">{nome}</span>
                  <span className="text-sm font-bold text-green-400">{formatCurrency(total)}</span>
                </div>
                {/* Linhas de meta */}
                <table className="w-full">
                  <tbody>
                    {lista.map(m => {
                      const mesLabel = MESES.find(x => `${ANO}-${x.value}` === m.mes)?.label ?? m.mes
                      return (
                        <tr key={m.id} className="border-b border-white/5 hover:bg-slate-700/20">
                          <td className="px-5 py-2 text-xs text-slate-400 w-24">{mesLabel}/{ANO}</td>
                          <td className="px-5 py-2 text-xs text-slate-400">{m.projeto ?? '—'}</td>
                          <td className="px-5 py-2 text-xs font-semibold text-white text-right">{formatCurrency(m.valorMeta)}</td>
                          <td className="px-3 py-2 text-right w-20">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEditar({ nomeVendedor: m.nomeVendedor, mes: m.mes, valorMeta: m.valorMeta, projeto: m.projeto ?? null })}
                                className="text-xs text-slate-400 hover:text-white transition-colors"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => { if (confirm('Excluir esta meta?')) deleteMutation.mutate({ id: m.id }) }}
                                className="text-slate-500 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
