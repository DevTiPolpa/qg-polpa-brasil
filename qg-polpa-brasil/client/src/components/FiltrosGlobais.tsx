import { useMemo, useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDashboardOriginalFiltrosDisponiveis } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { X, SlidersHorizontal, Calendar } from "lucide-react";
import MultiSelect from "@/components/MultiSelect";

export interface Filtros {
  mercados?: string[];
  vendedores?: string[];
  projetos?: string[];
  dataInicio?: string;
  dataFim?: string;
  /** Períodos específicos no formato "YYYY-MM". Quando presente, tem prioridade sobre
   * dataInicio/dataFim e permite combinar meses de anos distintos (ex.: Jan/2025 + Jul/2026). */
  periodos?: string[];
  codParc?: number;
  codParcs?: number[];
  gruposProduto?: string[];
  tiposReceita?: string[];
  mercado?: string;
  vendedor?: string;
  projeto?: string;
  grupoProduto?: string;
  tipoReceita?: string;
  codProduto?: number;
  codProdutos?: number[];
  uf?: string;
}

interface Props {
  filtros: Filtros;
  onChange: (f: Filtros) => void;
  showTipoReceita?: boolean;
  showProjetos?: boolean;
}

const MESES = [
  { value: "01", label: "Jan" },
  { value: "02", label: "Fev" },
  { value: "03", label: "Mar" },
  { value: "04", label: "Abr" },
  { value: "05", label: "Mai" },
  { value: "06", label: "Jun" },
  { value: "07", label: "Jul" },
  { value: "08", label: "Ago" },
  { value: "09", label: "Set" },
  { value: "10", label: "Out" },
  { value: "11", label: "Nov" },
  { value: "12", label: "Dez" },
];

const ANOS = ["2024", "2025", "2026", "2027"];

const TIPOS_RECEITA = [
  { value: "VENDA_FIRME", label: "Vendas Firmes" },
  { value: "FORECAST", label: "Forecast" },
  { value: "NOVO_PROJETO", label: "Projetos" },
];

type Atalho = { label: string; get: () => { dataInicio: string; dataFim: string } };

const ATALHOS: Atalho[] = [
  { label: "2026",         get: () => ({ dataInicio: "2026-01-01", dataFim: "2026-12-31" }) },
  { label: "2025",         get: () => ({ dataInicio: "2025-01-01", dataFim: "2025-12-31" }) },
];

function ultimoDia(ano: string, mes: string) {
  return new Date(parseInt(ano), parseInt(mes), 0).getDate();
}

function parseMesAno(iso?: string): { mes: string; ano: string } {
  if (!iso) return { mes: "", ano: "" };
  const parts = iso.split("-");
  return { ano: parts[0] ?? "", mes: parts[1] ?? "" };
}

function labelPeriodo(filtros: Filtros): string {
  const mesNome = (iso?: string) => MESES.find((x) => x.value === iso?.split("-")[1])?.label ?? "";
  const anoStr = (iso?: string) => iso?.split("-")[0] ?? "";

  if (filtros.periodos && filtros.periodos.length > 0) {
    const sorted = [...filtros.periodos].sort();
    const anosPresentes = new Set(sorted.map((p) => p.split("-")[0]));
    if (anosPresentes.size === 1 && sorted.length === 12) return `Ano ${[...anosPresentes][0]}`;
    if (sorted.length <= 3) {
      return sorted
        .map((p) => `${mesNome(p)}/${p.split("-")[0].slice(2)}`)
        .join(" + ");
    }
    return `${sorted.length} meses selecionados`;
  }

  if (filtros.dataInicio && filtros.dataFim) {
    const ai = anoStr(filtros.dataInicio);
    const af = anoStr(filtros.dataFim);
    if (ai === af && filtros.dataInicio === `${ai}-01-01` && filtros.dataFim === `${af}-12-31`)
      return `Ano ${ai}`;
    return `${mesNome(filtros.dataInicio)}/${ai.slice(2)} – ${mesNome(filtros.dataFim)}/${af.slice(2)}`;
  }
  return "Período";
}

// ─── Seletor de período por meses (multi-ano, estilo Excel) ──────────────────
// Cada ano marcado no topo abre sua própria seção de meses; os meses marcados
// em cada seção são combinados exatamente (sem produto cartesiano), permitindo
// selecionar por exemplo Jan/2025 + Jul/2026 sem trazer Jul/2025 ou Jan/2026 junto.
function derivarSelecaoInicial(filtros: Filtros): { anosAtivos: string[]; selecoes: Record<string, string[]> } {
  if (filtros.periodos && filtros.periodos.length > 0) {
    const selecoes: Record<string, string[]> = {};
    for (const p of filtros.periodos) {
      const [anoP, mesP] = p.split("-");
      if (!anoP || !mesP) continue;
      (selecoes[anoP] ??= []).push(mesP);
    }
    for (const anoP of Object.keys(selecoes)) selecoes[anoP].sort();
    return { anosAtivos: Object.keys(selecoes).sort(), selecoes };
  }

  const ini = filtros.dataInicio;
  const fim2 = filtros.dataFim;
  if (ini && fim2) {
    const anoIni = ini.split("-")[0];
    const anoFim = fim2.split("-")[0];
    if (anoIni === anoFim) {
      const meses = MESES.filter(m => {
        const cur = `${anoIni}-${m.value}`;
        return cur >= ini.slice(0, 7) && cur <= fim2.slice(0, 7);
      }).map(m => m.value);
      return { anosAtivos: [anoIni], selecoes: { [anoIni]: meses } };
    }
  }
  return { anosAtivos: ["2026"], selecoes: { "2026": MESES.map(m => m.value) } };
}

function PeriodoPicker({ filtros, onChange }: { filtros: Filtros; onChange: (f: Filtros) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const [anosAtivos, setAnosAtivos] = useState<string[]>(() => derivarSelecaoInicial(filtros).anosAtivos);
  const [selecoes, setSelecoes] = useState<Record<string, string[]>>(() => derivarSelecaoInicial(filtros).selecoes);

  useEffect(() => {
    const estado = derivarSelecaoInicial(filtros);
    setAnosAtivos(estado.anosAtivos);
    setSelecoes(estado.selecoes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros.periodos, filtros.dataInicio, filtros.dataFim]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function toggleAno(anoClicado: string) {
    setAnosAtivos(prev =>
      prev.includes(anoClicado) ? prev.filter(a => a !== anoClicado) : [...prev, anoClicado].sort()
    );
    setSelecoes(prev => (prev[anoClicado] ? prev : { ...prev, [anoClicado]: [] }));
  }

  function toggleMes(anoAlvo: string, mes: string) {
    setSelecoes(prev => {
      const atual = prev[anoAlvo] ?? [];
      const next = atual.includes(mes) ? atual.filter(m => m !== mes) : [...atual, mes].sort();
      return { ...prev, [anoAlvo]: next };
    });
  }

  function toggleTodosDoAno(anoAlvo: string) {
    setSelecoes(prev => {
      const atual = prev[anoAlvo] ?? [];
      const todos = atual.length === MESES.length;
      return { ...prev, [anoAlvo]: todos ? [] : MESES.map(m => m.value) };
    });
  }

  const totalSelecionado = anosAtivos.reduce((s, a) => s + (selecoes[a]?.length ?? 0), 0);

  function aplicar() {
    const periodos: string[] = [];
    for (const anoAlvo of anosAtivos) {
      for (const mes of selecoes[anoAlvo] ?? []) periodos.push(`${anoAlvo}-${mes}`);
    }
    if (periodos.length === 0) return;
    const sorted = periodos.sort();
    const primeiro = sorted[0];
    const ultimo = sorted[sorted.length - 1];
    const [anoUlt, mesUlt] = ultimo.split("-");
    const dia = ultimoDia(anoUlt, mesUlt);
    onChange({
      ...filtros,
      periodos: sorted,
      dataInicio: `${primeiro}-01`,
      dataFim: `${ultimo}-${String(dia).padStart(2, "0")}`,
    });
    setOpen(false);
  }

  const label = labelPeriodo(filtros);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-border bg-background text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        <Calendar className="w-3.5 h-3.5 shrink-0" />
        <span>{label}</span>
      </button>

      {open && (
        <div className="absolute top-9 left-0 z-50 bg-card border border-border rounded-xl shadow-2xl w-[220px] overflow-hidden">
          {/* Seletor de anos — multi-seleção */}
          <div className="flex border-b border-border">
            {ANOS.map(a => {
              const isActive = anosAtivos.includes(a);
              return (
                <button
                  key={a}
                  onClick={() => toggleAno(a)}
                  className={`flex-1 text-[10px] font-semibold py-1.5 transition-colors ${
                    isActive ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  {a}
                </button>
              );
            })}
          </div>

          {/* Uma seção de meses por ano ativo */}
          <div className="max-h-[280px] overflow-y-auto">
            {anosAtivos.length === 0 && (
              <p className="text-[11px] text-muted-foreground px-3 py-4 text-center">
                Selecione um ou mais anos acima.
              </p>
            )}
            {anosAtivos.map(anoAtivo => {
              const sel = selecoes[anoAtivo] ?? [];
              const todosSelecionados = sel.length === MESES.length;
              return (
                <div key={anoAtivo} className="border-b border-border last:border-b-0">
                  <label className="flex items-center gap-2 px-3 py-1.5 hover:bg-accent cursor-pointer bg-muted/40">
                    <input
                      type="checkbox"
                      checked={todosSelecionados}
                      onChange={() => toggleTodosDoAno(anoAtivo)}
                      className="w-3.5 h-3.5 accent-primary"
                    />
                    <span className="text-xs text-foreground font-semibold">{anoAtivo} · selecionar tudo</span>
                  </label>
                  <div className="py-1">
                    {MESES.map(m => (
                      <label key={m.value} className="flex items-center gap-2 px-3 py-1 hover:bg-accent cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sel.includes(m.value)}
                          onChange={() => toggleMes(anoAtivo, m.value)}
                          className="w-3.5 h-3.5 accent-primary"
                        />
                        <span className="text-xs text-foreground">{m.label}/{anoAtivo.slice(2)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Botão OK */}
          <div className="border-t border-border p-2">
            <button
              onClick={aplicar}
              disabled={totalSelecionado === 0}
              className="w-full text-xs py-1.5 rounded-md bg-primary/20 text-primary font-semibold hover:bg-primary/30 transition-colors disabled:opacity-40"
            >
              OK{totalSelecionado > 0 ? ` (${totalSelecionado})` : ""}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────
export default function FiltrosGlobais({ filtros, onChange, showTipoReceita = true, showProjetos = true }: Props) {
  const { data: disponiveis } = useQuery({
    queryKey: ["dashboard-original-filtros-disponiveis"],
    queryFn: getDashboardOriginalFiltrosDisponiveis,
    staleTime: 5 * 60 * 1000,
  });

  // Mapas cliente ↔ codParc para o filtro multi-select por cliente
  const clientesPorLabel = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of disponiveis?.clientes ?? []) {
      const nome = c.razaoSocial?.trim() || `Cliente ${c.codParc}`;
      const label = `${c.codParc} - ${nome}`;
      if (!map.has(label)) map.set(label, c.codParc);
    }
    return map;
  }, [disponiveis]);

  const labelPorCodParc = useMemo(() => {
    const map = new Map<number, string>();
    for (const [label, codParc] of clientesPorLabel.entries()) map.set(codParc, label);
    return map;
  }, [clientesPorLabel]);

  const clientesSelecionadosLabels = (filtros.codParcs ?? [])
    .map((cod) => labelPorCodParc.get(cod) ?? `${cod} - Cliente ${cod}`);

  const limpar = () => onChange({ dataInicio: "2026-01-01", dataFim: "2026-12-31" });

  const temFiltrosExtras = Object.entries(filtros).some(([k, v]) => {
    if (k === "codParc" || k === "dataInicio" || k === "dataFim" || k === "codProduto" || k === "uf" || k === "periodos") return false;
    if (Array.isArray(v)) return v.length > 0;
    return v !== undefined && v !== "";
  });

  const temFiltros =
    temFiltrosExtras ||
    (filtros.periodos?.length ?? 0) > 0 ||
    filtros.dataInicio !== "2026-01-01" ||
    filtros.dataFim !== "2026-12-31";

  const isAtalhoAtivo = (atalho: Atalho) => {
    if ((filtros.periodos?.length ?? 0) > 0) return false;
    const { dataInicio, dataFim } = atalho.get();
    return filtros.dataInicio === dataInicio && filtros.dataFim === dataFim;
  };

  const aplicarAtalho = (atalho: Atalho) => {
    const { dataInicio, dataFim } = atalho.get();
    if (isAtalhoAtivo(atalho)) {
      onChange({ ...filtros, dataInicio: "2026-01-01", dataFim: "2026-12-31", periodos: undefined });
    } else {
      onChange({ ...filtros, dataInicio, dataFim, periodos: undefined });
    }
  };

  const periodo = labelPeriodo(filtros);

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 space-y-2.5">
      {/* Header */}
      <div className="flex items-center gap-2 flex-wrap">
        <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Filtros</span>
        <span className="text-xs text-muted-foreground/50">· Previsão de Entrega (Embarque)</span>
        {periodo && periodo !== "Período" && (
          <span className="ml-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[11px] font-medium">
            {periodo}
          </span>
        )}
        {temFiltros && (
          <Button
            variant="ghost"
            size="sm"
            onClick={limpar}
            className="ml-auto h-6 text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
          >
            <X className="w-3 h-3" />
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Row 1: Multi-selects */}
      <div className="flex items-center gap-2 flex-wrap">
        <MultiSelect
          options={(disponiveis?.mercados ?? []).filter(Boolean) as string[]}
          selected={filtros.mercados ?? []}
          onChange={(vals) => onChange({ ...filtros, mercados: vals, mercado: vals[0] })}
          placeholder="Todos os mercados"
          className="flex-1 min-w-[130px] max-w-[200px]"
        />
        <MultiSelect
          options={(disponiveis?.vendedores ?? []).filter(Boolean) as string[]}
          selected={filtros.vendedores ?? []}
          onChange={(vals) => onChange({ ...filtros, vendedores: vals, vendedor: vals[0] })}
          placeholder="Todos os vendedores"
          className="flex-1 min-w-[140px] max-w-[210px]"
        />
        {showProjetos && (
          <MultiSelect
            options={(disponiveis?.projetos ?? []).filter(Boolean) as string[]}
            selected={filtros.projetos ?? []}
            onChange={(vals) => onChange({ ...filtros, projetos: vals, projeto: vals[0] })}
            placeholder="Todos os projetos"
            className="flex-1 min-w-[130px] max-w-[190px]"
          />
        )}
        <MultiSelect
          options={(disponiveis?.grupos ?? []).filter(Boolean) as string[]}
          selected={filtros.gruposProduto ?? []}
          onChange={(vals) => onChange({ ...filtros, gruposProduto: vals, grupoProduto: vals[0] })}
          placeholder="Todos os grupos"
          className="flex-1 min-w-[130px] max-w-[190px]"
          renderExpand={(grupo) => {
            const produtos = disponiveis?.produtosPorGrupo?.[grupo] ?? []
            const codProdutosSelecionados = filtros.codProdutos ?? []
            const toggleProduto = (codProdutoStr: string) => {
              const cod = Number(codProdutoStr)
              if (!Number.isFinite(cod)) return
              const next = codProdutosSelecionados.includes(cod)
                ? codProdutosSelecionados.filter((c) => c !== cod)
                : [...codProdutosSelecionados, cod]
              onChange({ ...filtros, codProdutos: next })
            }
            return produtos.length === 0 ? (
              <p className="text-[11px] text-muted-foreground py-1">Sem produtos cadastrados.</p>
            ) : (
              <ul className="max-h-40 overflow-y-auto space-y-0.5 py-1">
                {produtos.map((p) => {
                  const isSelected = codProdutosSelecionados.includes(Number(p.codProduto))
                  return (
                    <li key={p.codProduto}>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleProduto(p.codProduto) }}
                        className="flex items-center gap-1.5 w-full text-left text-[11px] text-muted-foreground hover:text-foreground transition-colors truncate"
                      >
                        <span
                          className={`w-3 h-3 rounded border flex items-center justify-center shrink-0 ${isSelected ? "bg-primary border-primary" : "border-border"}`}
                        >
                          {isSelected && <span className="w-1.5 h-1.5 rounded-sm bg-primary-foreground" />}
                        </span>
                        <span className="font-mono text-foreground/70">{p.codProduto}</span>
                        <span className="truncate">— {p.nomeProduto || "Sem descrição"}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )
          }}
        />
        <MultiSelect
          options={[...clientesPorLabel.keys()].sort((a, b) =>
            a.replace(/^\d+\s*-\s*/, "").localeCompare(b.replace(/^\d+\s*-\s*/, ""))
          )}
          selected={clientesSelecionadosLabels}
          onChange={(labels) => {
            const codParcs = labels.map((l) => clientesPorLabel.get(l)).filter((v): v is number => v != null);
            onChange({ ...filtros, codParcs, codParc: codParcs[0] });
          }}
          placeholder="Todos os clientes"
          searchable
          className="flex-1 min-w-[140px] max-w-[210px]"
        />
        {showTipoReceita && (
          <MultiSelect
            options={TIPOS_RECEITA.map((t) => t.label)}
            selected={(filtros.tiposReceita ?? []).map(
              (v) => TIPOS_RECEITA.find((t) => t.value === v)?.label ?? v
            )}
            onChange={(labels) => {
              const vals = labels.map((l) => TIPOS_RECEITA.find((t) => t.label === l)?.value ?? l);
              onChange({ ...filtros, tiposReceita: vals, tipoReceita: vals[0] });
            }}
            placeholder="Todos os tipos"
            className="flex-1 min-w-[120px] max-w-[170px]"
          />
        )}
      </div>

      {/* Row 2: Atalhos + seletor de período */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {ATALHOS.map((atalho) => (
            <button
              key={atalho.label}
              onClick={() => aplicarAtalho(atalho)}
              className={`h-7 px-2.5 rounded-md text-[11px] font-medium transition-all border ${
                isAtalhoAtivo(atalho)
                  ? "bg-primary/20 border-primary/50 text-primary"
                  : "bg-background border-border text-muted-foreground hover:text-foreground hover:border-border/80 hover:bg-accent"
              }`}
            >
              {atalho.label}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-border/60 mx-1 shrink-0" />

        <PeriodoPicker filtros={filtros} onChange={onChange} />
      </div>
    </div>
  );
}