import { useState, type ElementType } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2, XCircle, HelpCircle, X } from 'lucide-react'
import {
  getFunilScorecardDashboard,
  type FunilScorecardRecorte as TabRecorte,
  type FunilScorecardCadenciaKey as Recorte,
  type FunilScorecardCor as Cor,
  type FunilScorecardCadenciaVendedorRow as CadenciaVendedorRow,
  type FunilScorecardCadenciaRecorte as CadenciaRecorteData,
  type FunilScorecardLuzes as Luzes,
} from '../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Tabs } from '../components/ui/tabs'
import { formatCurrency, formatNumber, formatPercent } from '../lib/utils'

// ─── Constantes ─────────────────────────────────────────────────────────────
const TABS: { value: TabRecorte; label: string }[] = [
  { value: 'semana_anterior', label: 'Semana anterior' },
  { value: 'semana_atual',    label: 'Semana atual' },
  { value: 'mes_atual',       label: 'Mês atual' },
  { value: 'mes_anterior',    label: 'Mês anterior' },
]

const RECORTE_LABEL: Record<Recorte, string> = {
  semana_anterior: 'Semana anterior',
  semana_atual: 'Semana atual',
  semana_retrasada: 'Semana retrasada',
  mes_atual: 'Mês atual',
  mes_anterior: 'Mês anterior',
}

const COMPARACAO: Partial<Record<TabRecorte, { recorte: Recorte; label: string }>> = {
  semana_anterior: { recorte: 'semana_retrasada', label: 'Semana retrasada (referência)' },
  mes_atual: { recorte: 'mes_anterior', label: 'Mês anterior (referência)' },
  mes_anterior: { recorte: 'mes_atual', label: 'Mês atual (referência)' },
}

const REF_TEXT: Record<'abertos' | 'ganhos' | 'saldo' | 'perdidos', { semana: string; mes: string }> = {
  abertos:  { semana: 'meta: 5+ / semana', mes: 'meta: 22+ / mês' },
  ganhos:   { semana: 'meta: 1+ / semana', mes: 'meta: 5+ / mês' },
  saldo:    { semana: 'meta: positivo',    mes: 'meta: +5 / mês' },
  perdidos: { semana: 'taxa alvo: < 3%',   mes: 'taxa alvo: < 5%' },
}

const CHIP: Record<Cor, { icon: ElementType; className: string }> = {
  verde: { icon: CheckCircle2, className: 'icon-green' },
  amarelo: { icon: AlertTriangle, className: 'icon-amber' },
  vermelho: { icon: XCircle, className: 'icon-red' },
}

// ─── Regras de cor calculadas no front (ver SPEC_BACKEND.md) ─────────────────
function corPctAtingido(pct: number): Cor {
  if (pct >= 100) return 'verde'
  if (pct >= 85) return 'amarelo'
  return 'vermelho'
}
function corPctSla(pct: number | null): Cor | null {
  if (pct == null) return null
  if (pct < 30) return 'verde'
  if (pct <= 50) return 'amarelo'
  return 'vermelho'
}
function corPctFu(pct: number | null): Cor | null {
  if (pct == null) return null
  if (pct < 30) return 'verde'
  if (pct <= 60) return 'amarelo'
  return 'vermelho'
}
function formatSaldo(v: number): string {
  return `${v > 0 ? '+' : ''}${formatNumber(v)}`
}

// ─── Componentes auxiliares ───────────────────────────────────────────────────
function StatCard({ label, value, sub, cor }: { label: string; value: string; sub?: string; cor?: Cor | null }) {
  const chip = cor ? CHIP[cor] : null
  return (
    <Card className="border border-border bg-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest leading-tight">{label}</p>
          {chip && (
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${chip.className}`}>
              <chip.icon className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
        <p className="text-lg font-bold text-foreground tracking-tight leading-none">{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground mt-1.5">{sub}</p>}
      </CardContent>
    </Card>
  )
}

function CorPill({ cor, children }: { cor: Cor | null; children: React.ReactNode }) {
  if (cor == null) return <span className="text-muted-foreground text-sm">—</span>
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${CHIP[cor].className}`}>
      {children}
    </span>
  )
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-muted animate-pulse rounded ${className}`} />
}

// ─── Tabela de Cadência (reaproveitada pra tabela principal e a de comparação) ─
function CadenciaTable({ dados, mostrarCor, luzes }: { dados: CadenciaRecorteData; mostrarCor: boolean; luzes: Luzes | null }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Vendedor</TableHead>
          <TableHead className="text-right">Abertos</TableHead>
          <TableHead className="text-right">Ganhos</TableHead>
          <TableHead className="text-right">Perdidos</TableHead>
          <TableHead className="text-right">Avançaram</TableHead>
          <TableHead className="text-right">Saldo</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {dados.vendedores.map(v => (
          <TableRow key={v.nome}>
            <TableCell className="font-medium">{v.nome}</TableCell>
            <TableCell className="text-right tabular-nums">{formatNumber(v.abertos)}</TableCell>
            <TableCell className="text-right tabular-nums">{formatNumber(v.ganhos)}</TableCell>
            <TableCell className="text-right tabular-nums">{formatNumber(v.perdidos)}</TableCell>
            <TableCell className="text-right tabular-nums">{formatNumber(v.avancaram)}</TableCell>
            <TableCell className="text-right tabular-nums">{formatSaldo(v.saldo)}</TableCell>
          </TableRow>
        ))}
        <TableRow className="font-semibold border-t-2 border-border">
          <TableCell>TOTAL</TableCell>
          <TableCell className="text-right tabular-nums">{formatNumber(dados.totais.abertos)}</TableCell>
          <TableCell className="text-right tabular-nums">{formatNumber(dados.totais.ganhos)}</TableCell>
          <TableCell className="text-right tabular-nums">
            {formatNumber(dados.totais.perdidos)}
            {mostrarCor && luzes && <span className="text-muted-foreground font-normal"> ({formatNumber(luzes.taxaPerda, 1)}%)</span>}
          </TableCell>
          <TableCell className="text-right tabular-nums">{formatNumber(dados.totais.avancaram)}</TableCell>
          <TableCell className="text-right tabular-nums">{formatSaldo(dados.totais.saldo)}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  )
}

// ─── Modal "Como funciona" — conteúdo adaptado de funil-scorecard/app.py::render_ajuda ─
function SemaforoLinha({ cor, children }: { cor: Cor; children: React.ReactNode }) {
  const emoji = cor === 'verde' ? '🟢' : cor === 'amarelo' ? '🟡' : '🔴'
  return (
    <p className="text-sm text-muted-foreground flex items-start gap-1.5">
      <span>{emoji}</span>
      <span><b className="text-foreground">{cor[0].toUpperCase() + cor.slice(1)}</b> {children}</span>
    </p>
  )
}

function AjudaItem({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <h4 className="text-sm font-semibold text-foreground">{titulo}</h4>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function AjudaModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Como funciona o placar</DialogTitle>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
          </div>
          <p className="text-sm text-muted-foreground">Como cada indicador é calculado, em português — sem código, sem SQL.</p>
        </DialogHeader>

        <div className="space-y-6">
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">1. Resultado</h3>
            <AjudaItem titulo="Meta">
              <p className="text-sm text-muted-foreground">O valor que a empresa combinou bater no ano (ou no trimestre), cadastrado pela administração no próprio QG. Não é uma estimativa — é o número oficial.</p>
            </AjudaItem>
            <AjudaItem titulo="Realizado">
              <p className="text-sm text-muted-foreground">Soma do valor de tudo que é <b className="text-foreground">Venda Firme</b> (pedido já confirmado) mais <b className="text-foreground">Forecast</b> (previsão de venda que ainda não fechou 100%, mas já está no radar). Devolução entra descontando do total, e Novo Projeto fica de fora dessa conta.</p>
            </AjudaItem>
            <AjudaItem titulo="% atingido e as cores">
              <p className="text-sm text-muted-foreground">Realizado dividido pela Meta.</p>
              <SemaforoLinha cor="verde">100% ou mais — meta batida ou superada</SemaforoLinha>
              <SemaforoLinha cor="amarelo">entre 85% e 99% — perto, mas ainda não bateu</SemaforoLinha>
              <SemaforoLinha cor="vermelho">abaixo de 85% — longe da meta</SemaforoLinha>
            </AjudaItem>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">2. Cadência</h3>
            <AjudaItem titulo="Abertos">
              <p className="text-sm text-muted-foreground">Quantos negócios novos entraram no funil comercial no período (semana ou mês). Mostra se o time está trazendo demanda nova.</p>
            </AjudaItem>
            <AjudaItem titulo="Ganhos">
              <p className="text-sm text-muted-foreground">Quantos negócios foram fechados como venda (Ganho Fechado) no período.</p>
            </AjudaItem>
            <AjudaItem titulo="Perdidos">
              <p className="text-sm text-muted-foreground">Quantos negócios foram encerrados como perda no período — inclui negócio perdido de verdade (Perda Fechada, Sem Viabilidade) <b className="text-foreground">e também</b> negócio que caiu em "Vale a pena ver de novo", porque na prática ele saiu do radar ativo. Aparece em número absoluto e em <b className="text-foreground">taxa</b> (perdidos ÷ negócios ativos agora) — perder 20 de um funil de 300 é diferente de perder 20 de um funil de 60.</p>
            </AjudaItem>
            <AjudaItem titulo="Avançaram">
              <p className="text-sm text-muted-foreground">Quantos negócios subiram de etapa no funil durante o período. Fechar um negócio (ganho ou perdido) também conta como avançar. Se o negócio andou duas vezes na mesma semana, conta uma vez só.</p>
            </AjudaItem>
            <AjudaItem titulo="Saldo">
              <p className="text-sm text-muted-foreground">Abertos menos (Ganhos + Perdidos). Positivo = o funil está crescendo; negativo = está encolhendo mais rápido do que está sendo alimentado.</p>
            </AjudaItem>
            <AjudaItem titulo="Regras de cor — Semana anterior">
              <SemaforoLinha cor="verde">5 ou mais negócios abertos na semana</SemaforoLinha>
              <SemaforoLinha cor="amarelo">entre 3 e 4</SemaforoLinha>
              <SemaforoLinha cor="vermelho">menos de 3</SemaforoLinha>
              <p className="text-sm font-medium text-foreground mt-2">Ganhos:</p>
              <SemaforoLinha cor="verde">1 ou mais ganho na semana</SemaforoLinha>
              <SemaforoLinha cor="amarelo">zero ganho, mas a semana anterior a essa teve pelo menos 1</SemaforoLinha>
              <SemaforoLinha cor="vermelho">zero ganho por 2 semanas seguidas</SemaforoLinha>
              <p className="text-sm font-medium text-foreground mt-2">Saldo do funil:</p>
              <SemaforoLinha cor="verde">positivo</SemaforoLinha>
              <SemaforoLinha cor="amarelo">zero</SemaforoLinha>
              <SemaforoLinha cor="vermelho">negativo</SemaforoLinha>
              <p className="text-sm font-medium text-foreground mt-2">Taxa de perda (perdidos ÷ negócios ativos):</p>
              <SemaforoLinha cor="verde">menos de 3%</SemaforoLinha>
              <SemaforoLinha cor="amarelo">entre 3% e 6%</SemaforoLinha>
              <SemaforoLinha cor="vermelho">mais de 6%</SemaforoLinha>
            </AjudaItem>
            <AjudaItem titulo="Regras de cor — Mês atual / Mês anterior">
              <SemaforoLinha cor="verde">22 ou mais negócios abertos no mês</SemaforoLinha>
              <SemaforoLinha cor="amarelo">entre 15 e 21</SemaforoLinha>
              <SemaforoLinha cor="vermelho">menos de 15</SemaforoLinha>
              <p className="text-sm font-medium text-foreground mt-2">Ganhos:</p>
              <SemaforoLinha cor="verde">5 ou mais ganhos no mês</SemaforoLinha>
              <SemaforoLinha cor="amarelo">entre 3 e 4</SemaforoLinha>
              <SemaforoLinha cor="vermelho">menos de 3</SemaforoLinha>
              <p className="text-sm font-medium text-foreground mt-2">Saldo do funil:</p>
              <SemaforoLinha cor="verde">+5 ou mais</SemaforoLinha>
              <SemaforoLinha cor="amarelo">entre +1 e +4</SemaforoLinha>
              <SemaforoLinha cor="vermelho">zero ou negativo</SemaforoLinha>
              <p className="text-sm font-medium text-foreground mt-2">Taxa de perda:</p>
              <SemaforoLinha cor="verde">menos de 5%</SemaforoLinha>
              <SemaforoLinha cor="amarelo">entre 5% e 12%</SemaforoLinha>
              <SemaforoLinha cor="vermelho">mais de 12%</SemaforoLinha>
            </AjudaItem>
            <AjudaItem titulo="Uma correção importante">
              <p className="text-sm text-muted-foreground">Ganho <b className="text-foreground">nunca</b> aparece verde se o saldo do período estiver negativo — fechar 1 venda no meio de 20 perdas não é motivo de comemorar, então nesse caso o card de Ganhos fica no máximo amarelo.</p>
            </AjudaItem>
            <AjudaItem titulo="Semana atual (a que está em andamento)">
              <p className="text-sm text-muted-foreground">Não tem cor nenhuma de propósito — a semana ainda não fechou, então não é justo julgar. Os números aparecem sem cor, só pra acompanhamento de como a semana está começando.</p>
            </AjudaItem>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">3. Saúde</h3>
            <AjudaItem titulo="Ativos">
              <p className="text-sm text-muted-foreground">Negócios em andamento agora (não é ganho, não é perdido, não é "Vale a pena ver de novo" nem "Estagnado" — esses ficam de fora).</p>
            </AjudaItem>
            <AjudaItem titulo="Fora do SLA">
              <p className="text-sm text-muted-foreground">Negócio ativo que já está há mais tempo na etapa atual do que o prazo esperado pra aquela etapa. Calculado contando os dias desde a última vez que o negócio entrou na etapa em que está agora.</p>
            </AjudaItem>
            <AjudaItem titulo="Sem follow-up">
              <p className="text-sm text-muted-foreground">Negócio ativo sem nenhuma tarefa ou lembrete agendado pra frente no Bitrix — o sinal de "silêncio", negócio que pode estar esfriando sem ninguém perceber.</p>
            </AjudaItem>
            <AjudaItem titulo="Perfil A / B (só define qual prazo aplicar)">
              <p className="text-sm text-muted-foreground">Negócio abaixo de R$ 150 mil é perfil A; igual ou acima é perfil B. Esse valor <b className="text-foreground">nunca</b> é somado como faturamento — serve só pra escolher o prazo de SLA (negócio maior tem mais prazo).</p>
            </AjudaItem>
            <AjudaItem titulo="% fora do SLA e % sem follow-up — cores">
              <SemaforoLinha cor="verde">menos de 30% dos negócios ativos da vendedora</SemaforoLinha>
              <SemaforoLinha cor="amarelo">entre 30% e 50% (SLA) / entre 30% e 60% (follow-up)</SemaforoLinha>
              <SemaforoLinha cor="vermelho">acima de 50% (SLA) / acima de 60% (follow-up)</SemaforoLinha>
            </AjudaItem>
            <AjudaItem titulo="Prazos por fase (dias)">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fase</TableHead>
                    <TableHead className="text-right">Perfil A (&lt; R$150 mil)</TableHead>
                    <TableHead className="text-right">Perfil B (≥ R$150 mil)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    ['Qualificação', '10 dias', '15 dias'],
                    ['Proposta e Amostra', '20 dias', '20 dias'],
                    ['Avaliação no Cliente', '60 dias', '90 dias'],
                    ['Homologação e Teste Industrial', '60 dias', '120 dias'],
                    ['Fechamento', '10 dias', '15 dias'],
                  ].map(([fase, a, b]) => (
                    <TableRow key={fase}>
                      <TableCell>{fase}</TableCell>
                      <TableCell className="text-right">{a}</TableCell>
                      <TableCell className="text-right">{b}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AjudaItem>
            <AjudaItem titulo="Estagnado">
              <p className="text-sm text-muted-foreground">Categoria à parte — negócio marcado manualmente como parado, sem previsão de mexer. Não conta como perda nem como ativo, fica só documentado.</p>
            </AjudaItem>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">4. Ação</h3>
            <AjudaItem titulo="Como a lista é montada">
              <p className="text-sm text-muted-foreground">Pega todo negócio das 4 vendedoras do placar que está <b className="text-foreground">ao mesmo tempo</b> fora do SLA <b className="text-foreground">e</b> sem follow-up agendado, e ordena do mais parado pro menos parado. É a lista de prioridade pra reunião. Negócio de quem não está no placar não aparece aqui — isso é assunto do coordenador, não da reunião de cadência.</p>
            </AjudaItem>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Veredito</h3>
            <p className="text-sm text-muted-foreground">O texto no topo da tela é gerado automaticamente a partir dos números acima, seguindo regras fixas de prioridade (ex.: cadência boa mas saúde ruim aponta o problema pro meio do funil, não pro topo).</p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Página ────────────────────────────────────────────────────────────────
export default function FunilScorecard() {
  const [recorte, setRecorte] = useState<TabRecorte>('semana_anterior')
  const [ajudaOpen, setAjudaOpen] = useState(false)

  const query = useQuery({
    queryKey: ['funil-scorecard', 'dashboard', recorte],
    queryFn: () => getFunilScorecardDashboard(recorte),
  })

  const data = query.data
  const isSemana = recorte.startsWith('semana')

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Scorecard</h1>
          <p className="text-sm text-muted-foreground">Placar de revisão do funil comercial</p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs tabs={TABS} value={recorte} onChange={setRecorte} />
          <button
            onClick={() => setAjudaOpen(true)}
            title="Como funciona"
            className="w-9 h-9 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center shrink-0"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {query.isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" />
          </div>
        </div>
      )}

      {query.error && !query.isLoading && (
        <Card className="border border-destructive/40 bg-card">
          <CardContent className="p-4 text-sm text-destructive">
            Não foi possível carregar o placar. {query.error.message}
          </CardContent>
        </Card>
      )}

      {data && (
        <>
          {/* 0. Veredito */}
          <Card className="border border-border bg-card">
            <CardContent className="p-5">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                Veredito — {RECORTE_LABEL[recorte]}
              </p>
              <p className="text-base leading-relaxed text-foreground">{data.veredito}</p>
            </CardContent>
          </Card>

          {/* 1. Resultado */}
          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base">Resultado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Ano {data.resultado.ano}</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <StatCard label="Meta" value={formatCurrency(data.resultado.metaAno)} />
                  <StatCard label="Realizado" value={formatCurrency(data.resultado.realizadoAno)} />
                  <StatCard label="% Atingido" value={formatPercent(data.resultado.pctAno)} sub="meta: 100%" cor={corPctAtingido(data.resultado.pctAno)} />
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Trimestre atual — {data.resultado.trimestreLabel}</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <StatCard label="Meta" value={formatCurrency(data.resultado.metaTri)} />
                  <StatCard label="Realizado" value={formatCurrency(data.resultado.realizadoTri)} />
                  <StatCard label="% Atingido" value={formatPercent(data.resultado.pctTri)} sub="meta: 100%" cor={corPctAtingido(data.resultado.pctTri)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Cadência */}
          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base">Cadência — {data.cadencia[recorte].label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard
                  label="Abertos" value={formatNumber(data.cadencia[recorte].totais.abertos)}
                  cor={data.luzes?.abertos ?? null}
                  sub={data.luzes ? REF_TEXT.abertos[isSemana ? 'semana' : 'mes'] : 'acompanhamento'}
                />
                <StatCard
                  label="Ganhos" value={formatNumber(data.cadencia[recorte].totais.ganhos)}
                  cor={data.luzes?.ganhos ?? null}
                  sub={data.luzes ? REF_TEXT.ganhos[isSemana ? 'semana' : 'mes'] : 'acompanhamento'}
                />
                <StatCard
                  label="Perdidos"
                  value={`${formatNumber(data.cadencia[recorte].totais.perdidos)}${data.luzes ? ` (${formatNumber(data.luzes.taxaPerda, 1)}%)` : ''}`}
                  cor={data.luzes?.perdidos ?? null}
                  sub={data.luzes ? REF_TEXT.perdidos[isSemana ? 'semana' : 'mes'] : 'acompanhamento'}
                />
                <StatCard
                  label="Saldo" value={formatSaldo(data.cadencia[recorte].totais.saldo)}
                  cor={data.luzes?.saldo ?? null}
                  sub={data.luzes ? REF_TEXT.saldo[isSemana ? 'semana' : 'mes'] : 'acompanhamento'}
                />
              </div>

              <CadenciaTable dados={data.cadencia[recorte]} mostrarCor={!!data.luzes} luzes={data.luzes} />

              {COMPARACAO[recorte] && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    {COMPARACAO[recorte]!.label}
                  </h4>
                  <CadenciaTable dados={data.cadencia[COMPARACAO[recorte]!.recorte]} mostrarCor={false} luzes={null} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* 3. Saúde */}
          <Card className="border border-border bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Saúde</CardTitle>
                <span className="text-xs text-muted-foreground">foto de agora, igual em qualquer recorte</span>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendedor</TableHead>
                    <TableHead className="text-right">Ativos</TableHead>
                    <TableHead>Fora do SLA</TableHead>
                    <TableHead>Sem follow-up</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.saude.porVendedor.map(v => (
                    <TableRow key={v.nome}>
                      <TableCell className="font-medium">{v.nome}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(v.ativos)}</TableCell>
                      <TableCell>
                        <CorPill cor={corPctSla(v.pctSla)}>
                          {v.pctSla != null ? `${formatNumber(v.foraSla)} (${formatPercent(v.pctSla)})` : '—'}
                        </CorPill>
                      </TableCell>
                      <TableCell>
                        <CorPill cor={corPctFu(v.pctFu)}>
                          {v.pctFu != null ? `${formatNumber(v.semFollowup)} (${formatPercent(v.pctFu)})` : '—'}
                        </CorPill>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-semibold border-t-2 border-border">
                    <TableCell>TOTAL</TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(data.saude.totalAtivos)}</TableCell>
                    <TableCell>
                      <CorPill cor={corPctSla(data.saude.pctSlaAgregado)}>
                        {formatNumber(data.saude.totalForaSla)} ({formatPercent(data.saude.pctSlaAgregado)})
                      </CorPill>
                    </TableCell>
                    <TableCell>
                      <CorPill cor={corPctFu(data.saude.pctFuAgregado)}>
                        {formatNumber(data.saude.totalSemFollowup)} ({formatPercent(data.saude.pctFuAgregado)})
                      </CorPill>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <p className="text-sm text-muted-foreground mt-3">⏸ Estagnado: {formatNumber(data.saude.estagnado)}</p>
            </CardContent>
          </Card>

          {/* 4. Ação */}
          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base">
                Onde agir — só as {data.acao.length} do placar{data.acaoTotal !== data.acao.length ? `, ${data.acaoTotal} no total` : ''}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.acao.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">Nenhum negócio nessa situação — bom sinal.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Negócio</TableHead>
                      <TableHead>Vendedor</TableHead>
                      <TableHead>Fase</TableHead>
                      <TableHead className="text-right">Dias parado</TableHead>
                      <TableHead>Follow-up agendado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.acao.map((row, i) => (
                      <TableRow key={`${row.titulo}-${i}`}>
                        <TableCell className="font-medium">{row.titulo}</TableCell>
                        <TableCell>{row.vendedor}</TableCell>
                        <TableCell>{row.fase}</TableCell>
                        <TableCell className="text-right tabular-nums text-destructive font-medium">{formatNumber(row.dias)}d</TableCell>
                        <TableCell className="text-destructive font-medium">Não agendado</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <AjudaModal open={ajudaOpen} onClose={() => setAjudaOpen(false)} />
    </div>
  )
}
