import { useEffect, useMemo, useState, type ElementType } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearch, useLocation } from "wouter";
import {
  getTasks,
  getTask,
  updateTask,
  getUsers,
  type ApiTask,
  type ApiUser,
  type TaskStatus,
} from "@/lib/api";
import {
  STATUS_LABEL,
  STATUS_BADGE_CLASS,
  VENCIDA_BADGE_CLASS,
  VENCIDA_LABEL,
  ORIGEM_LABEL,
  isVencida,
} from "@/lib/tarefas";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatData } from "@/lib/utils";
import {
  ListTodo,
  Hourglass,
  Search as SearchIcon,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  X,
} from "lucide-react";

type FiltroKpi = TaskStatus | "VENCIDA" | null;

function KpiCard({ label, value, icon: Icon, iconClass, active, onClick }: {
  label: string; value: number; icon: ElementType; iconClass: string; active: boolean; onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="text-left">
      <Card className={`border bg-card transition-colors ${active ? "border-[oklch(0.65_0.20_145)]" : "border-border hover:border-muted-foreground/40"}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest leading-tight truncate">{label}</p>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconClass}`}>
              <Icon className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground tracking-tight leading-none">{value}</p>
        </CardContent>
      </Card>
    </button>
  );
}

function StatusBadge({ task }: { task: ApiTask }) {
  if (isVencida(task)) {
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap ${VENCIDA_BADGE_CLASS}`}>{VENCIDA_LABEL}</span>;
  }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap ${STATUS_BADGE_CLASS[task.status]}`}>{STATUS_LABEL[task.status]}</span>;
}

function DetalheTarefa({ taskId, onClose, onChanged }: { taskId: number; onClose: () => void; onChanged: () => void }) {
  const [, navigate] = useLocation();
  const { data: task, isLoading, refetch } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => getTask(taskId),
  });
  const { data: usuarios = [] } = useQuery({
    queryKey: ["users-ativos"],
    queryFn: () => getUsers(),
    staleTime: 5 * 60_000,
  });

  const [causa, setCausa] = useState("");
  const [acoes, setAcoes] = useState("");
  const [status, setStatus] = useState<TaskStatus>("PENDENTE");
  const [responsavelId, setResponsavelId] = useState<number | "">("");
  const [prazo, setPrazo] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!task) return;
    setCausa(task.causa ?? "");
    setAcoes(task.acoes ?? "");
    setStatus(task.status);
    setResponsavelId(task.responsavelId);
    setPrazo(task.prazo);
  }, [task]);

  const usuariosAtivos = usuarios.filter((u: ApiUser) => u.ativo);

  async function handleSalvar() {
    if (!task) return;
    setSaving(true);
    setError("");
    try {
      await updateTask(task.id, {
        causa,
        acoes,
        status,
        responsavelId: responsavelId === "" ? undefined : Number(responsavelId),
        prazo,
      });
      await refetch();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar tarefa.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-card border-border" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2 text-foreground">
            <span>Tarefa #{taskId}</span>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
          </DialogTitle>
        </DialogHeader>

        {isLoading && <p className="text-sm text-muted-foreground py-6 text-center">Carregando...</p>}

        {task && (
          <div className="space-y-5">
            {/* Origem */}
            <div className="rounded-lg border border-border bg-background/40 p-3 space-y-1 text-xs">
              <p className="text-muted-foreground"><span className="font-semibold text-foreground">Origem:</span> {ORIGEM_LABEL[task.origem]}</p>
              {task.razaoSocial && <p className="text-muted-foreground"><span className="font-semibold text-foreground">Cliente:</span> {task.razaoSocial}{task.codParc != null && <span> (Cód. {task.codParc})</span>}</p>}
              {task.nomeProduto && <p className="text-muted-foreground"><span className="font-semibold text-foreground">Produto:</span> {task.nomeProduto}{task.codProduto != null && <span> (Cód. {task.codProduto})</span>}</p>}
              <p className="text-muted-foreground"><span className="font-semibold text-foreground">Tipo de Ocorrência:</span> {task.tipoOcorrencia}</p>
              {task.infoVariacao && <p className="text-muted-foreground"><span className="font-semibold text-foreground">Situação identificada:</span> {task.infoVariacao}</p>}
              {task.origemUrl && (
                <button
                  type="button"
                  onClick={() => navigate(task.origemUrl!)}
                  className="flex items-center gap-1 text-[oklch(0.65_0.20_145)] hover:opacity-80 text-xs font-medium mt-1"
                >
                  <ExternalLink className="w-3 h-3" /> Ver na análise
                </button>
              )}
            </div>

            {/* Tratativa */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tratativa</h3>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Fato</label>
                <p className="text-sm text-foreground bg-background/40 border border-border rounded-lg px-3 py-2">{task.fato}</p>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Causa</label>
                <textarea
                  value={causa}
                  onChange={e => setCausa(e.target.value)}
                  rows={2}
                  placeholder="Justificativa da situação identificada..."
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Ações</label>
                <textarea
                  value={acoes}
                  onChange={e => setAcoes(e.target.value)}
                  rows={2}
                  placeholder="Ações realizadas ou planejadas..."
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none"
                />
              </div>
            </div>

            {/* Controle */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Controle</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Responsável</label>
                  <select
                    value={responsavelId}
                    onChange={e => setResponsavelId(e.target.value ? Number(e.target.value) : "")}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                  >
                    {usuariosAtivos.map((u: ApiUser) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as TaskStatus)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                  >
                    {(Object.keys(STATUS_LABEL) as TaskStatus[]).map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Prazo</label>
                  <input
                    type="date"
                    value={prazo}
                    onChange={e => setPrazo(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Data de criação</label>
                  <p className="text-sm text-foreground px-3 py-2">{formatData(task.createdAt?.slice(0, 10))}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Criado por: <span className="text-foreground">{task.criadoPorNome ?? "-"}</span></p>
            </div>

            {error && <p className="text-red-400 text-xs">{error}</p>}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSalvar}
                disabled={saving}
                className="bg-[oklch(0.65_0.20_145)] hover:opacity-90 disabled:opacity-50 text-white text-sm font-semibold rounded-lg px-4 py-2 transition"
              >
                {saving ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>

            {/* Histórico */}
            {task.historico.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Histórico</h3>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {task.historico.map(h => (
                    <div key={h.id} className="text-xs text-muted-foreground border-l-2 border-border pl-2.5 py-0.5">
                      <span className="text-foreground font-medium">{h.usuarioNome ?? "—"}</span>
                      {" · "}{formatData(h.createdAt?.slice(0, 10))}
                      {" · "}{h.tipoEvento}
                      {h.valorNovo && <span> → {h.valorNovo}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function Tarefas() {
  const search = useSearch();
  const queryClient = useQueryClient();
  const [filtroKpi, setFiltroKpi] = useState<FiltroKpi>(null);
  const [tarefaSelecionada, setTarefaSelecionada] = useState<number | null>(null);

  const searchParams = new URLSearchParams(search);
  const origemFiltro = searchParams.get("origem") ?? undefined;
  const codParcFiltro = searchParams.get("codParc") ? Number(searchParams.get("codParc")) : undefined;
  const codProdutoFiltro = searchParams.get("codProduto") ? Number(searchParams.get("codProduto")) : undefined;
  const temFiltroLinha = Boolean(origemFiltro);

  const { data: tarefas = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["tasks", origemFiltro, codParcFiltro, codProdutoFiltro],
    queryFn: () => getTasks({
      origem: origemFiltro as ApiTask["origem"] | undefined,
      codParc: codParcFiltro,
      codProduto: codProdutoFiltro,
    }),
  });

  function refetchTudo() {
    refetch();
    queryClient.invalidateQueries({ queryKey: ["tasks-por-origem"] });
  }

  const kpis = useMemo(() => ({
    pendentes: tarefas.filter(t => t.status === "PENDENTE").length,
    emAnalise: tarefas.filter(t => t.status === "EM_ANALISE").length,
    aguardandoRetorno: tarefas.filter(t => t.status === "AGUARDANDO_RETORNO").length,
    concluidas: tarefas.filter(t => t.status === "CONCLUIDA").length,
    vencidas: tarefas.filter(isVencida).length,
  }), [tarefas]);

  const tarefasFiltradas = useMemo(() => {
    if (!filtroKpi) return tarefas;
    if (filtroKpi === "VENCIDA") return tarefas.filter(isVencida);
    return tarefas.filter(t => t.status === filtroKpi);
  }, [tarefas, filtroKpi]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ListTodo className="w-6 h-6 text-green-400" />
            Tarefas
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Acompanhamento manual de variações identificadas nas análises
          </p>
        </div>
      </div>

      {temFiltroLinha && (
        <div className="flex items-center gap-2 text-xs bg-muted/50 border border-border rounded-lg px-3 py-2 w-fit">
          <span className="text-muted-foreground">
            Filtrado por: <span className="text-foreground font-medium">{ORIGEM_LABEL[origemFiltro as ApiTask["origem"]]}</span>
            {codParcFiltro != null && <span> · Cliente {codParcFiltro}</span>}
            {codProdutoFiltro != null && <span> · Produto {codProdutoFiltro}</span>}
          </span>
          <a href="/tarefas" className="text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></a>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KpiCard label="Pendentes" value={kpis.pendentes} icon={Hourglass} iconClass="bg-slate-700/50 text-slate-300" active={filtroKpi === "PENDENTE"} onClick={() => setFiltroKpi(f => f === "PENDENTE" ? null : "PENDENTE")} />
        <KpiCard label="Em Análise" value={kpis.emAnalise} icon={SearchIcon} iconClass="icon-blue" active={filtroKpi === "EM_ANALISE"} onClick={() => setFiltroKpi(f => f === "EM_ANALISE" ? null : "EM_ANALISE")} />
        <KpiCard label="Aguardando Retorno" value={kpis.aguardandoRetorno} icon={RotateCcw} iconClass="icon-amber" active={filtroKpi === "AGUARDANDO_RETORNO"} onClick={() => setFiltroKpi(f => f === "AGUARDANDO_RETORNO" ? null : "AGUARDANDO_RETORNO")} />
        <KpiCard label="Concluídas" value={kpis.concluidas} icon={CheckCircle2} iconClass="icon-green" active={filtroKpi === "CONCLUIDA"} onClick={() => setFiltroKpi(f => f === "CONCLUIDA" ? null : "CONCLUIDA")} />
        <KpiCard label="Vencidas" value={kpis.vencidas} icon={AlertTriangle} iconClass="icon-red" active={filtroKpi === "VENCIDA"} onClick={() => setFiltroKpi(f => f === "VENCIDA" ? null : "VENCIDA")} />
      </div>

      <Card className="border border-border bg-card overflow-hidden">
        <CardContent className="p-0">
          <div className="max-h-[720px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 z-20 bg-card">
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Tipo de Ocorrência</TableHead>
                  <TableHead>Prazo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground text-sm">Carregando...</TableCell></TableRow>
                )}
                {isError && (
                  <TableRow><TableCell colSpan={7} className="text-center py-10 text-sm text-[oklch(0.65_0.22_25)]">Não foi possível carregar as tarefas.</TableCell></TableRow>
                )}
                {!isLoading && !isError && tarefasFiltradas.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground text-sm">Nenhuma tarefa encontrada.</TableCell></TableRow>
                )}
                {!isLoading && !isError && tarefasFiltradas.map(task => (
                  <TableRow key={task.id} className="cursor-pointer" onClick={() => setTarefaSelecionada(task.id)}>
                    <TableCell><StatusBadge task={task} /></TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">{formatData(task.createdAt?.slice(0, 10))}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[220px] truncate" title={ORIGEM_LABEL[task.origem]}>{ORIGEM_LABEL[task.origem]}</TableCell>
                    <TableCell className="font-medium text-foreground max-w-[220px] truncate" title={task.razaoSocial ?? undefined}>{task.razaoSocial ?? "-"}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[160px] truncate" title={task.responsavelNome ?? undefined}>{task.responsavelNome ?? "-"}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate" title={task.tipoOcorrencia}>{task.tipoOcorrencia}</TableCell>
                    <TableCell className={`whitespace-nowrap ${isVencida(task) ? "text-red-400 font-semibold" : "text-muted-foreground"}`}>{formatData(task.prazo)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {tarefaSelecionada != null && (
        <DetalheTarefa
          taskId={tarefaSelecionada}
          onClose={() => setTarefaSelecionada(null)}
          onChanged={refetchTudo}
        />
      )}
    </div>
  );
}
