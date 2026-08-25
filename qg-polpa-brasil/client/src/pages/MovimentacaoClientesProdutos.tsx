import { useMemo, useState, type ElementType } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getMovimentacaoClientes,
  getMovimentacaoProdutos,
  getMovimentacaoClienteProdutos,
  getMovimentacaoProdutoClientes,
  getDashboardOriginalFiltrosDisponiveis,
  type MovimentacaoClienteAberto,
  type MovimentacaoClientePerdido,
  type MovimentacaoProduto,
} from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import MultiSelect from "@/components/MultiSelect";
import TarefaIndicador from "@/components/TarefaIndicador";
import ComentarioIndicador from "@/components/ComentarioIndicador";
import { useTarefasPorOrigem } from "@/hooks/useTarefasPorOrigem";
import { useComentariosPorOrigem } from "@/hooks/useComentariosPorOrigem";
import { TIPOS_OCORRENCIA_POR_ORIGEM } from "@/lib/tarefas";
import { formatCurrency, formatKg, formatNumber, formatData } from "@/lib/utils";
import { ArrowLeftRight, UserPlus, UserMinus, PackagePlus, PackageMinus, AlertTriangle, ChevronRight, ChevronDown, HelpCircle, X } from "lucide-react";

const TIPOS_OCORRENCIA_MOVIMENTACAO = TIPOS_OCORRENCIA_POR_ORIGEM.MOVIMENTACAO_CLIENTES_PRODUTOS;

// ─── Modal "Como funciona" ───────────────────────────────────────────────
function AjudaItem({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <h4 className="text-sm font-semibold text-foreground">{titulo}</h4>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function AjudaModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-foreground">Como funciona a Movimentação de Clientes e Produtos</DialogTitle>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
          </div>
          <p className="text-sm text-muted-foreground">
            Compara o ano selecionado com o ano anterior para mostrar quem entrou e quem saiu da base — de clientes e de produtos.
          </p>
        </DialogHeader>

        <div className="space-y-6">
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">1. As 4 visões</h3>
            <AjudaItem titulo="Clientes Abertos">
              <p className="text-sm text-muted-foreground">Clientes que compraram no ano selecionado mas <b className="text-foreground">não</b> tinham comprado no ano anterior — clientes novos ou reativados.</p>
            </AjudaItem>
            <AjudaItem titulo="Clientes Perdidos">
              <p className="text-sm text-muted-foreground">Clientes que compraram no ano anterior mas <b className="text-foreground">não</b> compraram no ano selecionado — pararam de comprar.</p>
            </AjudaItem>
            <AjudaItem titulo="Produtos Lançados">
              <p className="text-sm text-muted-foreground">Produtos vendidos no ano selecionado mas <b className="text-foreground">não</b> vendidos no ano anterior.</p>
            </AjudaItem>
            <AjudaItem titulo="Produtos Descontinuados">
              <p className="text-sm text-muted-foreground">Produtos vendidos no ano anterior mas <b className="text-foreground">não</b> vendidos no ano selecionado.</p>
            </AjudaItem>
            <p className="text-sm text-muted-foreground">A régua é sempre presença ou ausência de venda real (registro em <span className="text-foreground">fato_vendas</span>), nunca cadastro — cliente/produto cadastrado que nunca vendeu não entra em nenhuma das 4 listas.</p>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">2. Filtros</h3>
            <AjudaItem titulo="Ano">
              <p className="text-sm text-muted-foreground">Define o ano selecionado; o ano anterior (comparação) é sempre o ano imediatamente anterior a ele.</p>
            </AjudaItem>
            <AjudaItem titulo="Mercado de Vendas e Vendedor">
              <p className="text-sm text-muted-foreground">Aceitam seleção múltipla e recalculam as 4 visões considerando só as vendas daquele(s) mercado(s)/vendedor(es) — em ambos os anos comparados.</p>
            </AjudaItem>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">3. Detalhamento</h3>
            <AjudaItem titulo="Expandir uma linha">
              <p className="text-sm text-muted-foreground">Clicar numa linha de cliente mostra os produtos que ele comprou naquele ano; clicar numa linha de produto mostra os clientes que o compraram naquele ano.</p>
            </AjudaItem>
            <AjudaItem titulo="Vendedor (Última Compra)">
              <p className="text-sm text-muted-foreground">Nas visões de clientes, mostra quem atendeu a venda mais recente daquele cliente no ano de referência.</p>
            </AjudaItem>
            <AjudaItem titulo="Total no rodapé">
              <p className="text-sm text-muted-foreground">Cada tabela mostra 20 linhas por vez (o resto rola) e mantém uma linha de soma fixa no rodapé, sempre visível.</p>
            </AjudaItem>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">4. Tarefas</h3>
            <p className="text-sm text-muted-foreground">
              Qualquer linha (cliente ou produto) pode virar uma tarefa de acompanhamento — botão de criar tarefa em cada linha, com o Tipo de Ocorrência já sugerido conforme a visão (Cliente Aberto, Cliente Perdido, Produto Lançado ou Produto Descontinuado). Linhas com tarefas já criadas mostram um indicador "📋 N" que leva direto para elas.
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const ANOS = ["2024", "2025", "2026", "2027"];

// 20 linhas visíveis (linha compactada ~36px + cabeçalho 36px: 20*36 + 36 = 756px), o resto rola.
// [&_td]/[&_th]:whitespace-nowrap garante que nenhuma célula quebre texto em uma segunda linha
// (colunas de texto livre usam truncate + max-w para cortar com "..." em vez de quebrar).
const ALTURA_TABELA = "max-h-[756px] overflow-y-auto [&_td]:py-2 [&_th]:h-9 [&_td]:whitespace-nowrap [&_th]:whitespace-nowrap";

type AbaValue = "abertos" | "perdidos" | "lancados" | "descontinuados";

const TABS: { value: AbaValue; label: string; icon: ElementType }[] = [
  { value: "abertos", label: "Clientes Abertos", icon: UserPlus },
  { value: "perdidos", label: "Clientes Perdidos", icon: UserMinus },
  { value: "lancados", label: "Produtos Lançados", icon: PackagePlus },
  { value: "descontinuados", label: "Produtos Descontinuados", icon: PackageMinus },
];

function KpiCard({ label, value, icon: Icon, iconClass, loading }: {
  label: string; value: number; icon: ElementType; iconClass: string; loading: boolean;
}) {
  return (
    <Card className="border border-border bg-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest leading-tight truncate" title={label}>{label}</p>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconClass}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
        </div>
        <p className="text-2xl font-bold text-foreground tracking-tight leading-none">{loading ? "—" : formatNumber(value)}</p>
      </CardContent>
    </Card>
  );
}

// Linha única de estado (carregando / erro / vazio) reaproveitada pelas 4 tabelas
function LinhaEstado({ loading, error, vazio, colSpan }: {
  loading: boolean; error: boolean; vazio: boolean; colSpan: number;
}) {
  if (loading) {
    return (
      <TableRow>
        <TableCell colSpan={colSpan} className="text-center py-10 text-muted-foreground text-sm">
          Carregando...
        </TableCell>
      </TableRow>
    );
  }
  if (error) {
    return (
      <TableRow>
        <TableCell colSpan={colSpan} className="text-center py-10 text-sm">
          <div className="flex flex-col items-center gap-2 text-[oklch(0.65_0.22_25)]">
            <AlertTriangle className="w-5 h-5" />
            Não foi possível carregar os dados. Tente novamente em instantes.
          </div>
        </TableCell>
      </TableRow>
    );
  }
  if (vazio) {
    return (
      <TableRow>
        <TableCell colSpan={colSpan} className="text-center py-10 text-muted-foreground text-sm">
          Nenhum resultado encontrado para o período selecionado.
        </TableCell>
      </TableRow>
    );
  }
  return null;
}

function BotaoExpandir({ expanded }: { expanded: boolean }) {
  return expanded
    ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
    : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />;
}

// Célula da linha de total, fixada no rodapé visível da tabela (sticky bottom-0)
function CelulaTotal({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <TableCell className={`sticky bottom-0 z-10 bg-card border-t border-white/10 font-semibold text-foreground tabular-nums ${className}`}>
      {children}
    </TableCell>
  );
}

// Sublinha expandida: produtos comprados por um cliente naquele ano específico
function ProdutosDoCliente({ codParc, ano, mercados, vendedores }: { codParc: number; ano: number; mercados?: string[]; vendedores?: string[] }) {
  const { data: produtos = [], isLoading, isError } = useQuery({
    queryKey: ["movimentacao-cliente-produtos", codParc, ano, mercados, vendedores],
    queryFn: () => getMovimentacaoClienteProdutos(codParc, ano, mercados, vendedores),
  });

  if (isLoading) return <p className="text-xs text-muted-foreground py-2 px-2">Carregando produtos...</p>;
  if (isError) return <p className="text-xs text-[oklch(0.65_0.22_25)] py-2 px-2">Erro ao carregar produtos.</p>;
  if (produtos.length === 0) return <p className="text-xs text-muted-foreground py-2 px-2">Nenhum produto encontrado.</p>;

  return (
    <div className="space-y-0.5 py-2">
      {produtos.map((p) => (
        <div key={p.codProduto} className="flex items-center justify-between text-xs px-2 py-1 rounded hover:bg-muted/40">
          <span className="text-foreground truncate max-w-[420px]" title={p.nomeProduto}>
            {p.nomeProduto}
            {p.grupoProduto && <span className="text-muted-foreground"> · {p.grupoProduto}</span>}
          </span>
          <span className="flex items-center gap-3 shrink-0 ml-3 tabular-nums">
            <span className="text-muted-foreground">{formatKg(p.volume)}</span>
            <span className="font-semibold text-foreground">{formatCurrency(p.faturamento)}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

// Sublinha expandida: clientes que compraram um produto naquele ano específico
function ClientesDoProduto({ codProduto, ano, mercados, vendedores }: { codProduto: number; ano: number; mercados?: string[]; vendedores?: string[] }) {
  const { data: clientes = [], isLoading, isError } = useQuery({
    queryKey: ["movimentacao-produto-clientes", codProduto, ano, mercados, vendedores],
    queryFn: () => getMovimentacaoProdutoClientes(codProduto, ano, mercados, vendedores),
  });

  if (isLoading) return <p className="text-xs text-muted-foreground py-2 px-2">Carregando clientes...</p>;
  if (isError) return <p className="text-xs text-[oklch(0.65_0.22_25)] py-2 px-2">Erro ao carregar clientes.</p>;
  if (clientes.length === 0) return <p className="text-xs text-muted-foreground py-2 px-2">Nenhum cliente encontrado.</p>;

  return (
    <div className="space-y-0.5 py-2">
      {clientes.map((c) => (
        <div key={c.codParc} className="flex items-center justify-between text-xs px-2 py-1 rounded hover:bg-muted/40">
          <span className="text-foreground truncate max-w-[420px]" title={c.razaoSocial}>{c.razaoSocial}</span>
          <span className="flex items-center gap-3 shrink-0 ml-3 tabular-nums">
            <span className="text-muted-foreground">{formatKg(c.volume)}</span>
            <span className="font-semibold text-foreground">{formatCurrency(c.faturamento)}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

function LinhaClienteAberto({ cliente, ano, mercados, vendedores, contagemTarefas, onTarefaCriada, contagemComentarios, onComentarioAdicionado }: {
  cliente: MovimentacaoClienteAberto; ano: number; mercados?: string[]; vendedores?: string[];
  contagemTarefas: number; onTarefaCriada: () => void;
  contagemComentarios: number; onComentarioAdicionado: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <TableRow className="cursor-pointer" onClick={() => setExpanded((v) => !v)}>
        <TableCell className="w-8"><BotaoExpandir expanded={expanded} /></TableCell>
        <TableCell className="text-muted-foreground tabular-nums">{cliente.codParc}</TableCell>
        <TableCell className="font-medium text-foreground max-w-[260px] truncate" title={cliente.razaoSocial}>{cliente.razaoSocial}</TableCell>
        <TableCell className="text-right font-semibold text-foreground tabular-nums">{formatCurrency(cliente.faturamento)}</TableCell>
        <TableCell className="text-right tabular-nums">{formatNumber(cliente.pedidos)}</TableCell>
        <TableCell className="text-muted-foreground">{formatData(cliente.primeiraCompra)}</TableCell>
        <TableCell className="text-muted-foreground">{formatData(cliente.ultimaCompra)}</TableCell>
        <TableCell className="text-muted-foreground max-w-[160px] truncate" title={cliente.vendedorUltimaCompra ?? undefined}>{cliente.vendedorUltimaCompra ?? "-"}</TableCell>
        <TableCell>
          <TarefaIndicador
            origem="MOVIMENTACAO_CLIENTES_PRODUTOS"
            tiposOcorrencia={TIPOS_OCORRENCIA_MOVIMENTACAO}
            tipoOcorrenciaSugerido="Cliente Aberto"
            codParc={cliente.codParc}
            razaoSocial={cliente.razaoSocial}
            infoVariacao={`Faturamento ${ano}: ${formatCurrency(cliente.faturamento)} · Pedidos: ${formatNumber(cliente.pedidos)} · Última compra: ${formatData(cliente.ultimaCompra)}`}
            contagem={contagemTarefas}
            onCreated={onTarefaCriada}
          />
        </TableCell>
        <TableCell>
          <ComentarioIndicador
            origem="MOVIMENTACAO_CLIENTES_PRODUTOS"
            motivos={TIPOS_OCORRENCIA_MOVIMENTACAO}
            codParc={cliente.codParc}
            razaoSocial={cliente.razaoSocial}
            contagem={contagemComentarios}
            onAdded={onComentarioAdicionado}
          />
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow>
          <TableCell colSpan={10} className="bg-background/40 py-0">
            <div className="pl-9 pr-2">
              <ProdutosDoCliente codParc={cliente.codParc} ano={ano} mercados={mercados} vendedores={vendedores} />
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function LinhaClientePerdido({ cliente, ano, mercados, vendedores, contagemTarefas, onTarefaCriada, contagemComentarios, onComentarioAdicionado }: {
  cliente: MovimentacaoClientePerdido; ano: number; mercados?: string[]; vendedores?: string[];
  contagemTarefas: number; onTarefaCriada: () => void;
  contagemComentarios: number; onComentarioAdicionado: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <TableRow className="cursor-pointer" onClick={() => setExpanded((v) => !v)}>
        <TableCell className="w-8"><BotaoExpandir expanded={expanded} /></TableCell>
        <TableCell className="text-muted-foreground tabular-nums">{cliente.codParc}</TableCell>
        <TableCell className="font-medium text-foreground max-w-[260px] truncate" title={cliente.razaoSocial}>{cliente.razaoSocial}</TableCell>
        <TableCell className="text-right font-semibold text-foreground tabular-nums">{formatCurrency(cliente.faturamento)}</TableCell>
        <TableCell className="text-right tabular-nums">{formatNumber(cliente.pedidos)}</TableCell>
        <TableCell className="text-muted-foreground">{formatData(cliente.ultimaCompra)}</TableCell>
        <TableCell className="text-muted-foreground max-w-[160px] truncate" title={cliente.vendedorUltimaCompra ?? undefined}>{cliente.vendedorUltimaCompra ?? "-"}</TableCell>
        <TableCell>
          <TarefaIndicador
            origem="MOVIMENTACAO_CLIENTES_PRODUTOS"
            tiposOcorrencia={TIPOS_OCORRENCIA_MOVIMENTACAO}
            tipoOcorrenciaSugerido="Cliente Perdido"
            codParc={cliente.codParc}
            razaoSocial={cliente.razaoSocial}
            infoVariacao={`Faturamento ${ano}: ${formatCurrency(cliente.faturamento)} · Pedidos: ${formatNumber(cliente.pedidos)} · Última compra: ${formatData(cliente.ultimaCompra)}`}
            contagem={contagemTarefas}
            onCreated={onTarefaCriada}
          />
        </TableCell>
        <TableCell>
          <ComentarioIndicador
            origem="MOVIMENTACAO_CLIENTES_PRODUTOS"
            motivos={TIPOS_OCORRENCIA_MOVIMENTACAO}
            codParc={cliente.codParc}
            razaoSocial={cliente.razaoSocial}
            contagem={contagemComentarios}
            onAdded={onComentarioAdicionado}
          />
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow>
          <TableCell colSpan={9} className="bg-background/40 py-0">
            <div className="pl-9 pr-2">
              <ProdutosDoCliente codParc={cliente.codParc} ano={ano} mercados={mercados} vendedores={vendedores} />
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function LinhaProduto({ produto, ano, mercados, vendedores, tipoOcorrencia, contagemTarefas, onTarefaCriada, contagemComentarios, onComentarioAdicionado }: {
  produto: MovimentacaoProduto; ano: number; mercados?: string[]; vendedores?: string[];
  tipoOcorrencia: "Produto Lançado" | "Produto Descontinuado"; contagemTarefas: number; onTarefaCriada: () => void;
  contagemComentarios: number; onComentarioAdicionado: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <TableRow className="cursor-pointer" onClick={() => setExpanded((v) => !v)}>
        <TableCell className="w-8"><BotaoExpandir expanded={expanded} /></TableCell>
        <TableCell className="text-muted-foreground tabular-nums">{produto.codProduto}</TableCell>
        <TableCell className="font-medium text-foreground max-w-[260px] truncate" title={produto.nomeProduto}>{produto.nomeProduto}</TableCell>
        <TableCell className="text-muted-foreground max-w-[140px] truncate" title={produto.grupoProduto ?? undefined}>{produto.grupoProduto ?? "-"}</TableCell>
        <TableCell className="text-right tabular-nums">{formatKg(produto.volume)}</TableCell>
        <TableCell className="text-right font-semibold text-foreground tabular-nums">{formatCurrency(produto.faturamento)}</TableCell>
        <TableCell className="text-right tabular-nums">{formatNumber(produto.clientes)}</TableCell>
        <TableCell className="text-muted-foreground">{formatData(produto.primeiraVenda)}</TableCell>
        <TableCell className="text-muted-foreground">{formatData(produto.ultimaVenda)}</TableCell>
        <TableCell>
          <TarefaIndicador
            origem="MOVIMENTACAO_CLIENTES_PRODUTOS"
            tiposOcorrencia={TIPOS_OCORRENCIA_MOVIMENTACAO}
            tipoOcorrenciaSugerido={tipoOcorrencia}
            codProduto={produto.codProduto}
            nomeProduto={produto.nomeProduto}
            infoVariacao={`Volume ${ano}: ${formatKg(produto.volume)} · Faturamento: ${formatCurrency(produto.faturamento)} · Clientes: ${formatNumber(produto.clientes)}`}
            contagem={contagemTarefas}
            onCreated={onTarefaCriada}
          />
        </TableCell>
        <TableCell>
          <ComentarioIndicador
            origem="MOVIMENTACAO_CLIENTES_PRODUTOS"
            motivos={TIPOS_OCORRENCIA_MOVIMENTACAO}
            codProduto={produto.codProduto}
            nomeProduto={produto.nomeProduto}
            contagem={contagemComentarios}
            onAdded={onComentarioAdicionado}
          />
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow>
          <TableCell colSpan={11} className="bg-background/40 py-0">
            <div className="pl-9 pr-2">
              <ClientesDoProduto codProduto={produto.codProduto} ano={ano} mercados={mercados} vendedores={vendedores} />
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export default function MovimentacaoClientesProdutos() {
  const [ano, setAno] = useState("2026");
  const [mercadosSelecionados, setMercadosSelecionados] = useState<string[]>([]);
  const [vendedoresSelecionados, setVendedoresSelecionados] = useState<string[]>([]);
  const [aba, setAba] = useState<AbaValue>("abertos");
  const [ajudaOpen, setAjudaOpen] = useState(false);
  const anoNum = Number(ano);
  const anoAnterior = anoNum - 1;
  const mercadosFiltro = mercadosSelecionados.length ? mercadosSelecionados : undefined;
  const vendedoresFiltro = vendedoresSelecionados.length ? vendedoresSelecionados : undefined;

  const { data: filtrosDisponiveis } = useQuery({
    queryKey: ["dashboard-original-filtros-disponiveis"],
    queryFn: () => getDashboardOriginalFiltrosDisponiveis(),
    staleTime: 5 * 60_000,
  });
  const mercadosDisponiveis = filtrosDisponiveis?.mercados ?? [];
  const vendedoresDisponiveis = filtrosDisponiveis?.vendedores ?? [];

  const { contagem: contagemTarefas, refetch: refetchTarefas } = useTarefasPorOrigem("MOVIMENTACAO_CLIENTES_PRODUTOS");
  const { contagem: contagemComentarios, refetch: refetchComentarios } = useComentariosPorOrigem("MOVIMENTACAO_CLIENTES_PRODUTOS");

  const { data: clientes, isLoading: loadingClientes, isError: erroClientes } = useQuery({
    queryKey: ["movimentacao-clientes", anoNum, mercadosFiltro, vendedoresFiltro],
    queryFn: () => getMovimentacaoClientes(anoNum, mercadosFiltro, vendedoresFiltro),
    staleTime: 60_000,
  });

  const { data: produtos, isLoading: loadingProdutos, isError: erroProdutos } = useQuery({
    queryKey: ["movimentacao-produtos", anoNum, mercadosFiltro, vendedoresFiltro],
    queryFn: () => getMovimentacaoProdutos(anoNum, mercadosFiltro, vendedoresFiltro),
    staleTime: 60_000,
  });

  const abertos = clientes?.abertos ?? [];
  const perdidos = clientes?.perdidos ?? [];
  const lancados = produtos?.lancados ?? [];
  const descontinuados = produtos?.descontinuados ?? [];

  const totalAbertos = useMemo(() => ({
    faturamento: abertos.reduce((s, c) => s + c.faturamento, 0),
    pedidos: abertos.reduce((s, c) => s + c.pedidos, 0),
  }), [abertos]);

  const totalPerdidos = useMemo(() => ({
    faturamento: perdidos.reduce((s, c) => s + c.faturamento, 0),
    pedidos: perdidos.reduce((s, c) => s + c.pedidos, 0),
  }), [perdidos]);

  const totalLancados = useMemo(() => ({
    volume: lancados.reduce((s, p) => s + p.volume, 0),
    faturamento: lancados.reduce((s, p) => s + p.faturamento, 0),
  }), [lancados]);

  const totalDescontinuados = useMemo(() => ({
    volume: descontinuados.reduce((s, p) => s + p.volume, 0),
    faturamento: descontinuados.reduce((s, p) => s + p.faturamento, 0),
  }), [descontinuados]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6 text-green-400" />
            Movimentação de Clientes e Produtos
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Comparativo {ano} vs {anoAnterior} · clique numa linha para ver o detalhe · clientes e produtos que entraram ou saíram da base
          </p>
        </div>
        <button
          onClick={() => setAjudaOpen(true)}
          title="Como funciona"
          className="w-9 h-9 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center shrink-0"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Filtros: Ano, Mercado de Vendas e Vendedor (Mercado e Vendedor aceitam múltipla seleção) */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Ano</span>
          <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-0.5">
            {ANOS.map((a) => (
              <button
                key={a}
                onClick={() => setAno(a)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  ano === a ? "bg-[oklch(0.65_0.20_145)] text-white" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Mercado de Vendas</span>
          <MultiSelect
            options={mercadosDisponiveis}
            selected={mercadosSelecionados}
            onChange={setMercadosSelecionados}
            placeholder="Todos os mercados"
            className="w-56"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Vendedor</span>
          <MultiSelect
            options={vendedoresDisponiveis}
            selected={vendedoresSelecionados}
            onChange={setVendedoresSelecionados}
            placeholder="Todos os vendedores"
            className="w-56"
          />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Clientes Abertos" value={abertos.length} icon={UserPlus} iconClass="icon-green" loading={loadingClientes} />
        <KpiCard label="Clientes Perdidos" value={perdidos.length} icon={UserMinus} iconClass="icon-red" loading={loadingClientes} />
        <KpiCard label="Produtos Lançados" value={lancados.length} icon={PackagePlus} iconClass="icon-blue" loading={loadingProdutos} />
        <KpiCard label="Produtos Descontinuados" value={descontinuados.length} icon={PackageMinus} iconClass="icon-amber" loading={loadingProdutos} />
      </div>

      {/* Abas */}
      <Tabs tabs={TABS} value={aba} onChange={setAba} />

      {/* Tabela da aba ativa — altura de ~20 linhas, restante rola; total fixado no rodapé */}
      <Card className="border border-border bg-card overflow-hidden">
        <CardContent className="p-0">
          {aba === "abertos" && (
            <div className={ALTURA_TABELA}>
              <Table>
                <TableHeader className="sticky top-0 z-20 bg-card">
                  <TableRow>
                    <TableHead className="w-8" />
                    <TableHead>Código</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Fat {ano}</TableHead>
                    <TableHead className="text-right">Pedidos</TableHead>
                    <TableHead>1ª Compra</TableHead>
                    <TableHead>Última Compra</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Tarefas</TableHead>
                    <TableHead>Comentários</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <LinhaEstado loading={loadingClientes} error={erroClientes} vazio={!loadingClientes && !erroClientes && abertos.length === 0} colSpan={10} />
                  {!loadingClientes && !erroClientes && abertos.map((c) => (
                    <LinhaClienteAberto
                      key={c.codParc} cliente={c} ano={anoNum} mercados={mercadosFiltro} vendedores={vendedoresFiltro}
                      contagemTarefas={contagemTarefas(c.codParc)} onTarefaCriada={refetchTarefas}
                      contagemComentarios={contagemComentarios(c.codParc)} onComentarioAdicionado={refetchComentarios}
                    />
                  ))}
                  {!loadingClientes && !erroClientes && abertos.length > 0 && (
                    <TableRow>
                      <CelulaTotal className="text-left" >Total ({abertos.length})</CelulaTotal>
                      <CelulaTotal />
                      <CelulaTotal />
                      <CelulaTotal className="text-right">{formatCurrency(totalAbertos.faturamento)}</CelulaTotal>
                      <CelulaTotal className="text-right">{formatNumber(totalAbertos.pedidos)}</CelulaTotal>
                      <CelulaTotal />
                      <CelulaTotal />
                      <CelulaTotal />
                      <CelulaTotal />
                      <CelulaTotal />
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {aba === "perdidos" && (
            <div className={ALTURA_TABELA}>
              <Table>
                <TableHeader className="sticky top-0 z-20 bg-card">
                  <TableRow>
                    <TableHead className="w-8" />
                    <TableHead>Código</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Fat {anoAnterior}</TableHead>
                    <TableHead className="text-right">Pedidos</TableHead>
                    <TableHead>Última Compra</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Tarefas</TableHead>
                    <TableHead>Comentários</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <LinhaEstado loading={loadingClientes} error={erroClientes} vazio={!loadingClientes && !erroClientes && perdidos.length === 0} colSpan={9} />
                  {!loadingClientes && !erroClientes && perdidos.map((c) => (
                    <LinhaClientePerdido
                      key={c.codParc} cliente={c} ano={anoAnterior} mercados={mercadosFiltro} vendedores={vendedoresFiltro}
                      contagemTarefas={contagemTarefas(c.codParc)} onTarefaCriada={refetchTarefas}
                      contagemComentarios={contagemComentarios(c.codParc)} onComentarioAdicionado={refetchComentarios}
                    />
                  ))}
                  {!loadingClientes && !erroClientes && perdidos.length > 0 && (
                    <TableRow>
                      <CelulaTotal className="text-left">Total ({perdidos.length})</CelulaTotal>
                      <CelulaTotal />
                      <CelulaTotal />
                      <CelulaTotal className="text-right">{formatCurrency(totalPerdidos.faturamento)}</CelulaTotal>
                      <CelulaTotal className="text-right">{formatNumber(totalPerdidos.pedidos)}</CelulaTotal>
                      <CelulaTotal />
                      <CelulaTotal />
                      <CelulaTotal />
                      <CelulaTotal />
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {aba === "lancados" && (
            <div className={ALTURA_TABELA}>
              <Table>
                <TableHeader className="sticky top-0 z-20 bg-card">
                  <TableRow>
                    <TableHead className="w-8" />
                    <TableHead>Código</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Grupo</TableHead>
                    <TableHead className="text-right">Volume {ano}</TableHead>
                    <TableHead className="text-right">Fat {ano}</TableHead>
                    <TableHead className="text-right">Clientes</TableHead>
                    <TableHead>1ª Venda</TableHead>
                    <TableHead>Última Venda</TableHead>
                    <TableHead>Tarefas</TableHead>
                    <TableHead>Comentários</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <LinhaEstado loading={loadingProdutos} error={erroProdutos} vazio={!loadingProdutos && !erroProdutos && lancados.length === 0} colSpan={11} />
                  {!loadingProdutos && !erroProdutos && lancados.map((p) => (
                    <LinhaProduto
                      key={p.codProduto} produto={p} ano={anoNum} mercados={mercadosFiltro} vendedores={vendedoresFiltro}
                      tipoOcorrencia="Produto Lançado" contagemTarefas={contagemTarefas(undefined, p.codProduto)} onTarefaCriada={refetchTarefas}
                      contagemComentarios={contagemComentarios(undefined, p.codProduto)} onComentarioAdicionado={refetchComentarios}
                    />
                  ))}
                  {!loadingProdutos && !erroProdutos && lancados.length > 0 && (
                    <TableRow>
                      <CelulaTotal className="text-left">Total ({lancados.length})</CelulaTotal>
                      <CelulaTotal />
                      <CelulaTotal />
                      <CelulaTotal />
                      <CelulaTotal className="text-right">{formatKg(totalLancados.volume)}</CelulaTotal>
                      <CelulaTotal className="text-right">{formatCurrency(totalLancados.faturamento)}</CelulaTotal>
                      <CelulaTotal />
                      <CelulaTotal />
                      <CelulaTotal />
                      <CelulaTotal />
                      <CelulaTotal />
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {aba === "descontinuados" && (
            <div className={ALTURA_TABELA}>
              <Table>
                <TableHeader className="sticky top-0 z-20 bg-card">
                  <TableRow>
                    <TableHead className="w-8" />
                    <TableHead>Código</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Grupo</TableHead>
                    <TableHead className="text-right">Volume {anoAnterior}</TableHead>
                    <TableHead className="text-right">Fat {anoAnterior}</TableHead>
                    <TableHead className="text-right">Clientes</TableHead>
                    <TableHead>1ª Venda</TableHead>
                    <TableHead>Última Venda</TableHead>
                    <TableHead>Tarefas</TableHead>
                    <TableHead>Comentários</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <LinhaEstado loading={loadingProdutos} error={erroProdutos} vazio={!loadingProdutos && !erroProdutos && descontinuados.length === 0} colSpan={11} />
                  {!loadingProdutos && !erroProdutos && descontinuados.map((p) => (
                    <LinhaProduto
                      key={p.codProduto} produto={p} ano={anoAnterior} mercados={mercadosFiltro} vendedores={vendedoresFiltro}
                      tipoOcorrencia="Produto Descontinuado" contagemTarefas={contagemTarefas(undefined, p.codProduto)} onTarefaCriada={refetchTarefas}
                      contagemComentarios={contagemComentarios(undefined, p.codProduto)} onComentarioAdicionado={refetchComentarios}
                    />
                  ))}
                  {!loadingProdutos && !erroProdutos && descontinuados.length > 0 && (
                    <TableRow>
                      <CelulaTotal className="text-left">Total ({descontinuados.length})</CelulaTotal>
                      <CelulaTotal />
                      <CelulaTotal />
                      <CelulaTotal />
                      <CelulaTotal className="text-right">{formatKg(totalDescontinuados.volume)}</CelulaTotal>
                      <CelulaTotal className="text-right">{formatCurrency(totalDescontinuados.faturamento)}</CelulaTotal>
                      <CelulaTotal />
                      <CelulaTotal />
                      <CelulaTotal />
                      <CelulaTotal />
                      <CelulaTotal />
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AjudaModal open={ajudaOpen} onClose={() => setAjudaOpen(false)} />
    </div>
  );
}
