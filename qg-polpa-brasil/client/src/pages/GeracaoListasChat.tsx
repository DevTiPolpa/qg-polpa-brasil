import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'wouter'
import { ArrowLeft, Bot, User, Send, Loader2, Copy, Check, ArrowRight, AlertTriangle } from 'lucide-react'
import { chatGeracaoListasBriefing, finalizarGeracaoListasBriefing, type GeracaoListasBriefing } from '../lib/api'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'

type Mensagem = { role: 'user' | 'assistant'; content: string }

type Finalizacao = { cardId: number; prompt: string; exclusionCount: number; truncado: boolean }

const MENSAGEM_INICIAL = 'Oi, quero criar uma lista de prospecção nova.'

export default function GeracaoListasChat() {
  const [, navigate] = useLocation()
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [history, setHistory] = useState<unknown[]>([])
  const [input, setInput] = useState('')
  const [finalizacao, setFinalizacao] = useState<Finalizacao | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [finalizando, setFinalizando] = useState(false)
  const [erro, setErro] = useState(false)
  const iniciouRef = useRef(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Chamada direta (sem useMutation): o disparo inicial acontece dentro de um
  // useEffect de montagem, e o React.StrictMode (ativo em main.tsx) desmonta e
  // remonta esse efeito de propósito em dev pra pegar bugs de efeito colateral.
  // useMutation ficava com o resultado "órfão" nesse ciclo - a requisição
  // completava normalmente, mas o estado da mutation nunca refletia isso e a
  // tela travava em "Digitando...". Async/await simples não tem esse problema:
  // o resultado é usado direto no mesmo closure que fez a chamada.
  async function enviar(texto: string, historicoAtual: unknown[]) {
    setMensagens(prev => [...prev, { role: 'user', content: texto }])
    setEnviando(true)
    setErro(false)
    try {
      const data = await chatGeracaoListasBriefing({ message: texto, history: historicoAtual })
      setMensagens(prev => [...prev, { role: 'assistant', content: data.resposta }])
      setHistory(data.history)
      if (data.briefing) {
        await finalizarBriefing(data.briefing, data.history)
      }
    } catch {
      setErro(true)
    } finally {
      setEnviando(false)
    }
  }

  async function finalizarBriefing(briefing: GeracaoListasBriefing, conversa: unknown[]) {
    setFinalizando(true)
    setErro(false)
    try {
      const data = await finalizarGeracaoListasBriefing({ briefing, conversa })
      setFinalizacao(data)
    } catch {
      setErro(true)
    } finally {
      setFinalizando(false)
    }
  }

  useEffect(() => {
    if (iniciouRef.current) return
    iniciouRef.current = true
    enviar(MENSAGEM_INICIAL, [])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens.length, enviando])

  function handleEnviarClick() {
    const texto = input.trim()
    if (!texto || enviando) return
    setInput('')
    enviar(texto, history)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEnviarClick() }
  }

  function handleCopiar() {
    if (!finalizacao) return
    navigator.clipboard.writeText(finalizacao.prompt)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const chatEncerrado = !!finalizacao || finalizando

  return (
    <div className="space-y-6 fade-in max-w-3xl">
      <div>
        <button
          onClick={() => navigate('/geracao-listas/novo')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
        <h1 className="text-xl font-bold text-foreground">Briefing da lista</h1>
        <p className="text-sm text-muted-foreground">Converse com o assistente pra montar o pedido de prospecção.</p>
      </div>

      <Card className="border border-border bg-card">
        <CardContent className="p-4 space-y-4">
          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
            {mensagens.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-green-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-green-700 text-white rounded-br-sm'
                    : 'bg-muted text-foreground rounded-bl-sm border border-border'
                }`}>
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </div>
            ))}

            {enviando && (
              <div className="flex gap-3 justify-start">
                <div className="w-7 h-7 rounded-full bg-green-700 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="bg-muted border border-border rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                  <span className="text-muted-foreground text-xs">Digitando...</span>
                </div>
              </div>
            )}

            {finalizando && (
              <p className="text-center text-xs text-muted-foreground py-2">Gerando prompt de prospecção...</p>
            )}

            {erro && (
              <p className="text-center text-destructive text-xs py-2">
                Erro ao conversar com o assistente. Tente novamente.
              </p>
            )}

            <div ref={bottomRef} />
          </div>

          {!chatEncerrado && (
            <div className="flex gap-2 items-end pt-2 border-t border-border">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Responda ao assistente..."
                rows={1}
                className="flex-1 bg-background border border-input text-foreground placeholder-muted-foreground rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-primary transition-colors"
                style={{ maxHeight: 120, overflowY: 'auto' }}
                disabled={enviando}
              />
              <button
                onClick={handleEnviarClick}
                disabled={!input.trim() || enviando}
                className="w-11 h-11 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground rounded-xl flex items-center justify-center transition-colors shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {finalizacao && (
        <Card className="border border-border bg-card">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-foreground">Prompt pronto pra Manus</h3>
              <Button variant="outline" size="sm" onClick={handleCopiar}>
                {copiado ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copiado ? 'Copiado!' : 'Copiar'}
              </Button>
            </div>

            <textarea
              readOnly
              value={finalizacao.prompt}
              rows={10}
              className="w-full bg-background border border-input text-foreground rounded-md px-3 py-2 text-sm font-mono resize-y focus:outline-none"
            />

            <p className="text-xs text-muted-foreground">
              {finalizacao.exclusionCount} empresa(s) já conhecida(s) excluída(s) do prompt.
            </p>

            {finalizacao.truncado && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-600/40 bg-amber-600/10 px-3 py-2.5 text-sm text-amber-400">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Lista de exclusão atingiu o limite — esse segmento já tem bastante cobertura.</span>
              </div>
            )}

            <Button onClick={() => navigate(`/geracao-listas/${finalizacao.cardId}`)}>
              Ir para a lista
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
