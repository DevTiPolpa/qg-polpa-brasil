import { useState, useRef, useEffect, useCallback } from 'react'
import { trpc } from '../lib/trpc'
import { Send, Bot, User, Loader2, Plus, Trash2, MessageSquare, ChevronLeft } from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function newSessionId() {
  return `conv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function formatDate(date: Date | string) {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60_000) return 'agora'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}min`
  if (diff < 86_400_000) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (diff < 604_800_000) return d.toLocaleDateString('pt-BR', { weekday: 'short' })
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

const EXAMPLES = [
  'Qual o faturamento total de 2026?',
  'Quais vendedores têm mais negócios em andamento?',
  'Mostre os negócios parados há mais de 30 dias',
  'Compare pipeline Comercial vs Marca Própria',
]

// ─── Componente ───────────────────────────────────────────────────────────────

export default function Chat() {
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [agentHistories, setAgentHistories] = useState<Record<string, unknown[]>>({})
  const [input, setInput] = useState('')
  const [showSidebar, setShowSidebar] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  const sessionsQuery = trpc.chatbot.sessions.useQuery()
  const historyQuery = trpc.chatbot.history.useQuery(
    { sessionId: activeSession! },
    { enabled: !!activeSession }
  )

  const sendMutation = trpc.chatbot.send.useMutation({
    onSuccess: (data) => {
      setAgentHistories(prev => ({ ...prev, [activeSession!]: data.agentHistory }))
      historyQuery.refetch()
      sessionsQuery.refetch()
    },
  })

  const deleteMutation = trpc.chatbot.deleteSession.useMutation({
    onSuccess: (_data, vars) => {
      if (activeSession === vars.sessionId) setActiveSession(null)
      setAgentHistories(prev => { const n = { ...prev }; delete n[vars.sessionId]; return n })
      sessionsQuery.refetch()
    },
  })

  // Seleciona conversa mais recente ao carregar
  useEffect(() => {
    if (!activeSession && sessionsQuery.data && sessionsQuery.data.length > 0) {
      setActiveSession(sessionsQuery.data[0].session_id)
    }
  }, [sessionsQuery.data, activeSession])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [historyQuery.data?.length, sendMutation.isPending])

  const handleNewChat = useCallback(() => {
    const sid = newSessionId()
    setActiveSession(sid)
    setInput('')
    setShowSidebar(false)
  }, [])

  const handleSend = useCallback(() => {
    const msg = input.trim()
    if (!msg || sendMutation.isPending || !activeSession) return
    setInput('')
    setShowSidebar(false)
    sendMutation.mutate({
      sessionId: activeSession,
      message: msg,
      history: agentHistories[activeSession] ?? [],
    })
  }, [input, sendMutation, activeSession, agentHistories])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const messages = (historyQuery.data ?? []).map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  const sessions = sessionsQuery.data ?? []
  const isEmpty = messages.length === 0 && !sendMutation.isPending

  // ─── Sidebar ────────────────────────────────────────────────────────────────

  const sidebar = (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-700">
      <div className="p-3 border-b border-slate-700">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-colors"
        >
          <Plus size={15} />
          Nova conversa
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {sessions.length === 0 && (
          <p className="text-slate-500 text-xs text-center py-8">Nenhuma conversa ainda</p>
        )}
        {sessions.map((s) => {
          const isActive = s.session_id === activeSession
          const title = s.title ? s.title.slice(0, 60) : 'Nova conversa'
          return (
            <div
              key={s.session_id}
              className={`group flex items-start gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                isActive ? 'bg-slate-700' : 'hover:bg-slate-800'
              }`}
              onClick={() => { setActiveSession(s.session_id); setShowSidebar(false) }}
            >
              <MessageSquare size={14} className="text-slate-500 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-slate-200 text-sm truncate leading-snug">{title}</p>
                <p className="text-slate-500 text-xs mt-0.5">{formatDate(s.last_at)}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteMutation.mutate({ sessionId: s.session_id }) }}
                className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all shrink-0 mt-0.5"
              >
                <Trash2 size={13} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )

  // ─── Chat area ──────────────────────────────────────────────────────────────

  const chatArea = (
    <div className="flex flex-col h-full">
      {/* Header mobile */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700 md:hidden">
        <button onClick={() => setShowSidebar(true)} className="text-slate-400 hover:text-white">
          <ChevronLeft size={20} />
        </button>
        <Bot size={18} className="text-green-400" />
        <span className="text-white text-sm font-medium">Agente IA</span>
      </div>

      {/* Header desktop */}
      <div className="hidden md:flex items-center gap-3 px-5 py-3 border-b border-slate-700">
        <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
          <Bot size={16} className="text-white" />
        </div>
        <div>
          <p className="text-white text-sm font-semibold">Agente IA</p>
          <p className="text-slate-400 text-xs">Faturamento + CRM Bitrix24 — SQL Server</p>
        </div>
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isEmpty && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-green-600/20 flex items-center justify-center">
              <Bot size={28} className="text-green-400" />
            </div>
            <div>
              <p className="text-white font-semibold">Como posso ajudar?</p>
              <p className="text-slate-400 text-sm mt-1">Pergunte sobre faturamento, pipeline ou qualquer análise.</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {EXAMPLES.map((ex) => (
                <button key={ex} onClick={() => setInput(ex)}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-full border border-slate-600 transition-colors">
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-green-700 flex items-center justify-center shrink-0 mt-0.5">
                <Bot size={14} className="text-white" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
              msg.role === 'user'
                ? 'bg-green-700 text-white rounded-br-sm'
                : 'bg-slate-800 text-slate-100 rounded-bl-sm border border-slate-700 font-mono'
            }`}>
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-full bg-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                <User size={14} className="text-white" />
              </div>
            )}
          </div>
        ))}

        {sendMutation.isPending && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 rounded-full bg-green-700 flex items-center justify-center shrink-0">
              <Bot size={14} className="text-white" />
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
              <Loader2 size={14} className="text-green-400 animate-spin" />
              <span className="text-slate-400 text-xs">Consultando banco de dados...</span>
            </div>
          </div>
        )}

        {sendMutation.isError && (
          <p className="text-center text-red-400 text-xs py-2">
            Erro ao conectar com o agente. Verifique se o serviço Python está rodando.
          </p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t border-slate-700">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Faça uma pergunta sobre faturamento ou CRM..."
            rows={1}
            className="flex-1 bg-slate-800 border border-slate-600 text-slate-100 placeholder-slate-500 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-green-500 transition-colors"
            style={{ maxHeight: '120px', overflowY: 'auto' }}
            disabled={sendMutation.isPending}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sendMutation.isPending || !activeSession}
            className="w-11 h-11 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl flex items-center justify-center transition-colors shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )

  // ─── Layout ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-slate-900">
      {/* Sidebar */}
      <div className={`${showSidebar ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-64 shrink-0`}>
        {sidebar}
      </div>

      {/* Chat */}
      <div className={`${!showSidebar || !activeSession ? 'flex' : 'hidden'} md:flex flex-col flex-1 overflow-hidden`}>
        {!activeSession ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <Bot size={40} className="text-slate-600" />
            <p className="text-slate-400 text-sm">Selecione uma conversa ou inicie uma nova.</p>
            <button onClick={handleNewChat}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm rounded-lg transition-colors">
              <Plus size={16} /> Nova conversa
            </button>
          </div>
        ) : chatArea}
      </div>
    </div>
  )
}
