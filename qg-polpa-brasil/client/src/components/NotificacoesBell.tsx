import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocation } from 'wouter'
import { Bell, Check, ClipboardList, AlertTriangle } from 'lucide-react'
import { getNotificacoes, marcarNotificacaoLida, marcarTodasNotificacoesLidas, type ApiNotificacao, type NotificacaoTipo } from '../lib/api'

const ICONE_POR_TIPO: Record<NotificacaoTipo, { Icon: typeof Bell; className: string }> = {
  TAREFA_ATRIBUIDA: { Icon: ClipboardList, className: 'text-green-400' },
  TAREFA_REATRIBUIDA: { Icon: ClipboardList, className: 'text-blue-400' },
  TAREFA_VENCIDA: { Icon: AlertTriangle, className: 'text-red-400' },
}

// Timestamp vem do backend em UTC sem sufixo de fuso — mesmo ajuste já usado em
// ComentariosModal/"Última Compra" (anexar "Z" antes de parsear).
function formatDataHora(iso: string | null): string {
  if (!iso) return '-'
  const data = new Date(iso.endsWith('Z') ? iso : `${iso}Z`)
  if (Number.isNaN(data.getTime())) return '-'
  return data.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

interface Props {
  /** Sidebar recolhida mostra só o ícone; painel abre para cima (fica no rodapé). */
  collapsed?: boolean
  dropdownAlign?: 'top' | 'bottom'
}

export default function NotificacoesBell({ collapsed = false, dropdownAlign = 'top' }: Props) {
  const [, navigate] = useLocation()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)

  const { data: notificacoes = [] } = useQuery({
    queryKey: ['notificacoes'],
    queryFn: () => getNotificacoes(),
    refetchInterval: 60_000,
  })
  const naoLidas = notificacoes.filter(n => !n.lida).length

  async function abrirNotificacao(n: ApiNotificacao) {
    setOpen(false)
    if (!n.lida) {
      try {
        await marcarNotificacaoLida(n.id)
        queryClient.invalidateQueries({ queryKey: ['notificacoes'] })
      } catch {
        // Navega mesmo se marcar como lida falhar — não é bloqueante.
      }
    }
    navigate(`/tarefas?taskId=${n.taskId}`)
  }

  async function marcarTodas() {
    try {
      await marcarTodasNotificacoesLidas()
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] })
    } catch {
      // silencioso — usuário pode tentar de novo
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        title="Notificações"
        className={`relative flex items-center gap-2 w-full rounded-lg px-2 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition ${collapsed ? 'justify-center' : ''}`}
      >
        <Bell size={16} className="shrink-0" />
        {!collapsed && <span>Notificações</span>}
        {naoLidas > 0 && (
          <span className={`flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full min-w-[16px] h-4 px-1 ${collapsed ? 'absolute -top-0.5 -right-0.5' : 'ml-auto'}`}>
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className={`absolute z-50 w-80 max-h-96 overflow-y-auto bg-slate-800 border border-slate-700 rounded-lg shadow-xl ${
              dropdownAlign === 'top' ? 'bottom-full mb-2 left-0' : 'top-full mt-2 right-0'
            }`}
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700 sticky top-0 bg-slate-800">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Notificações</span>
              {naoLidas > 0 && (
                <button onClick={marcarTodas} className="flex items-center gap-1 text-[11px] text-green-400 hover:text-green-300">
                  <Check className="w-3 h-3" /> Marcar todas como lidas
                </button>
              )}
            </div>

            {notificacoes.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-6">Nenhuma notificação ainda.</p>
            )}

            {notificacoes.map(n => {
              const { Icon, className } = ICONE_POR_TIPO[n.tipo]
              return (
                <button
                  key={n.id}
                  onClick={() => abrirNotificacao(n)}
                  className={`block w-full text-left px-3 py-2.5 border-b border-slate-700/50 last:border-b-0 hover:bg-slate-700/50 transition ${!n.lida ? 'bg-slate-700/20' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${className}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-white truncate">{n.titulo}</p>
                        {!n.lida && <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{n.mensagem}</p>
                      <p className="text-[10px] text-slate-500 mt-1">{formatDataHora(n.createdAt)}</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
