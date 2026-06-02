import { useEffect, useMemo, useState } from 'react'
import { Target, Plus, Trash2, Save, X } from 'lucide-react'
import {
  ApiMeta2026,
  deleteMeta2026,
  getMetas2026,
  upsertMeta2026,
} from '../lib/api'
import { formatCurrency } from '../lib/utils'

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
  mercadoVendas: string
}

const FORM_VAZIO: FormState = {
  nomeVendedor: '',
  mes: '01',
  valorMeta: '',
  projeto: '',
  mercadoVendas: '',
}

export default function Metas() {
  const [metas, setMetas] = useState<ApiMeta2026[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(FORM_VAZIO)
  const [editando, setEditando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function carregarMetas() {
    setIsLoading(true)
    setErro(null)

    try {
      const data = await getMetas2026(ANO)
      setMetas(data)
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao carregar metas.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    carregarMetas()
  }, [])

  const vendedores = useMemo(() => {
    return Array.from(new Set(metas.map(meta => meta.nomeVendedor)))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
  }, [metas])

  const porVendedor = useMemo(() => {
    const map = new Map<string, ApiMeta2026[]>()

    for (const meta of metas) {
      const lista = map.get(meta.nomeVendedor) ?? []
      lista.push(meta)
      map.set(meta.nomeVendedor, lista)
    }

    return Array.from(map.entries())
      .map(([nome, lista]) => ({
        nome,
        total: lista.reduce((soma, meta) => soma + Number(meta.valorMeta || 0), 0),
        metas: lista.sort((a, b) => a.mes.localeCompare(b.mes)),
      }))
      .sort((a, b) => b.total - a.total)
  }, [metas])

  function parseValorMeta(valor: string) {
    return parseFloat(valor.replace(/\./g, '').replace(',', '.'))
  }

  async function handleSalvar() {
    setErro(null)

    if (!form.nomeVendedor.trim()) {
      setErro('Informe ou selecione um vendedor.')
      return
    }

    const valor = parseValorMeta(form.valorMeta)

    if (isNaN(valor) || valor < 0) {
      setErro('Informe um valor de meta válido.')
      return
    }

    setIsSaving(true)

    try {
      await upsertMeta2026({
        nomeVendedor: form.nomeVendedor.trim(),
        mes: `${ANO}-${form.mes}`,
        valorMeta: valor,
        projeto: form.projeto.trim() || null,
        mercadoVendas: form.mercadoVendas.trim() || null,
      })

      setForm(FORM_VAZIO)
      setEditando(false)
      await carregarMetas()
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao salvar meta.')
    } finally {
      setIsSaving(false)
    }
  }

  function handleEditar(meta: ApiMeta2026) {
    setForm({
      nomeVendedor: meta.nomeVendedor,
      mes: meta.mes.split('-')[1] ?? '01',
      valorMeta: String(meta.valorMeta),
      projeto: meta.projeto ?? '',
      mercadoVendas: meta.mercadoVendas ?? '',
    })
    setEditando(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleExcluir(id: number) {
    if (!confirm('Excluir esta meta?')) return

    setErro(null)
    setIsDeletingId(id)

    try {
      await deleteMeta2026(id)
      await carregarMetas()
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao excluir meta.')
    } finally {
      setIsDeletingId(null)
    }
  }

  return (
    <div className="space-y-6 p-1">
      <div className="flex items-center gap-3">
        <Target className="w-5 h-5 text-green-400" />
        <h1 className="text-lg font-bold text-white">Metas por Vendedor — {ANO}</h1>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          {editando ? <><Save className="w-4 h-4" /> Editar Meta</> : <><Plus className="w-4 h-4" /> Nova Meta</>}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Vendedor</label>
            <input
              list="vendedores-metas"
              value={form.nomeVendedor}
              onChange={e => setForm(f => ({ ...f, nomeVendedor: e.target.value }))}
              placeholder="ex: 73 - MARIA BAY"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
            <datalist id="vendedores-metas">
              {vendedores.map(vendedor => <option key={vendedor} value={vendedor} />)}
            </datalist>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400">Mês</label>
            <select
              value={form.mes}
              onChange={e => setForm(f => ({ ...f, mes: e.target.value }))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              {MESES.map(mes => <option key={mes.value} value={mes.value}>{mes.label}/{ANO}</option>)}
            </select>
          </div>

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

          <div className="space-y-1">
            <label className="text-xs text-slate-400">Projeto <span className="text-slate-500">(opcional)</span></label>
            <input
              type="text"
              placeholder="ex: NOVOS PROJETOS"
              value={form.projeto}
              onChange={e => setForm(f => ({ ...f, projeto: e.target.value }))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400">Mercado <span className="text-slate-500">(opcional)</span></label>
            <input
              type="text"
              placeholder="ex: B2B"
              value={form.mercadoVendas}
              onChange={e => setForm(f => ({ ...f, mercadoVendas: e.target.value }))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
        </div>

        {erro && <p className="text-red-400 text-xs mt-3">{erro}</p>}

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSalvar}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? 'Salvando...' : 'Salvar Meta'}
          </button>

          {editando && (
            <button
              onClick={() => { setForm(FORM_VAZIO); setEditando(false); setErro(null) }}
              className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white text-sm rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Cancelar
            </button>
          )}
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Metas Cadastradas</h2>
          <span className="text-xs text-slate-400">{metas.length} registro{metas.length !== 1 ? 's' : ''}</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-slate-400 text-sm">Carregando...</div>
        ) : metas.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-slate-500 text-sm">Nenhuma meta cadastrada ainda.</div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {porVendedor.map(({ nome, total, metas: lista }) => (
              <div key={nome}>
                <div className="px-5 py-2.5 bg-slate-700/30 flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">{nome}</span>
                  <span className="text-sm font-bold text-green-400">{formatCurrency(total)}</span>
                </div>

                <table className="w-full">
                  <tbody>
                    {lista.map(meta => {
                      const mesLabel = MESES.find(x => `${ANO}-${x.value}` === meta.mes)?.label ?? meta.mes

                      return (
                        <tr key={meta.id} className="border-b border-white/5 hover:bg-slate-700/20">
                          <td className="px-5 py-2 text-xs text-slate-400 w-24">{mesLabel}/{ANO}</td>
                          <td className="px-5 py-2 text-xs text-slate-400">{meta.projeto ?? '—'}</td>
                          <td className="px-5 py-2 text-xs text-slate-400">{meta.mercadoVendas ?? '—'}</td>
                          <td className="px-5 py-2 text-xs font-semibold text-white text-right">{formatCurrency(meta.valorMeta)}</td>
                          <td className="px-3 py-2 text-right w-24">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEditar(meta)}
                                className="text-xs text-slate-400 hover:text-white transition-colors"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleExcluir(meta.id)}
                                disabled={isDeletingId === meta.id}
                                className="text-slate-500 hover:text-red-400 transition-colors disabled:opacity-40"
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