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
import MultiSelect from "@/components/MultiSelect";
import { formatCurrency, formatKg, formatNumber, formatData } from "@/lib/utils";
import { ArrowLeftRight, UserPlus, UserMinus, PackagePlus, PackageMinus, AlertTriangle, ChevronRight, ChevronDown } from "lucide-react";

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

function LinhaClienteAberto({ cliente, ano, mercados, vendedores }: { cliente: MovimentacaoClienteAberto; ano: number; mercados?: string[]; vendedores?: string[] }) {
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
      </TableRow>
      {expanded && (
        <TableRow>
          <TableCell colSpan={8} className="bg-background/40 py-0">
            <div className="pl-9 pr-2">
              <ProdutosDoCliente codParc={cliente.codParc} ano={ano} mercados={mercados} vendedores={vendedores} />
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function LinhaClientePerdido({ cliente, ano, mercados, vendedores }: { cliente: MovimentacaoClientePerdido; ano: number; mercados?: string[]; vendedores?: string[] }) {
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
      </TableRow>
      {expanded && (
        <TableRow>
          <TableCell colSpan={7} className="bg-background/40 py-0">
            <div className="pl-9 pr-2">
              <ProdutosDoCliente codParc={cliente.codParc} ano={ano} mercados={mercados} vendedores={vendedores} />
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function LinhaProduto({ produto, ano, mercados, vendedores }: { produto: MovimentacaoProduto; ano: number; mercados?: string[]; vendedores?: string[] }) {
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
      </TableRow>
      {expanded && (
        <TableRow>
          <TableCell colSpan={9} className="bg-background/40 py-0">
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <LinhaEstado loading={loadingClientes} error={erroClientes} vazio={!loadingClientes && !erroClientes && abertos.length === 0} colSpan={8} />
                  {!loadingClientes && !erroClientes && abertos.map((c) => (
                    <LinhaClienteAberto key={c.codParc} cliente={c} ano={anoNum} mercados={mercadosFiltro} vendedores={vendedoresFiltro} />
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <LinhaEstado loading={loadingClientes} error={erroClientes} vazio={!loadingClientes && !erroClientes && perdidos.length === 0} colSpan={7} />
                  {!loadingClientes && !erroClientes && perdidos.map((c) => (
                    <LinhaClientePerdido key={c.codParc} cliente={c} ano={anoAnterior} mercados={mercadosFiltro} vendedores={vendedoresFiltro} />
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <LinhaEstado loading={loadingProdutos} error={erroProdutos} vazio={!loadingProdutos && !erroProdutos && lancados.length === 0} colSpan={9} />
                  {!loadingProdutos && !erroProdutos && lancados.map((p) => (
                    <LinhaProduto key={p.codProduto} produto={p} ano={anoNum} mercados={mercadosFiltro} vendedores={vendedoresFiltro} />
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <LinhaEstado loading={loadingProdutos} error={erroProdutos} vazio={!loadingProdutos && !erroProdutos && descontinuados.length === 0} colSpan={9} />
                  {!loadingProdutos && !erroProdutos && descontinuados.map((p) => (
                    <LinhaProduto key={p.codProduto} produto={p} ano={anoAnterior} mercados={mercadosFiltro} vendedores={vendedoresFiltro} />
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
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
