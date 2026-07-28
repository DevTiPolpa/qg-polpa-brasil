import { useRef, useState } from 'react'
import { useLocation, useParams } from 'wouter'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Download, Trash2, Upload, AlertTriangle, FileSpreadsheet } from 'lucide-react'
import {
  obterGeracaoListasCard,
  classificarGeracaoListasLista,
  exportarGeracaoListasExcel,
  excluirGeracaoListasCard,
  getCurrentUser,
} from '../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { ClasseBadge, Skeleton, downloadBase64File } from '../components/GeracaoListasUi'
import { formatNumber, formatPercent } from '../lib/utils'

function lerArquivoBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.slice(result.indexOf(',') + 1))
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border border-border bg-card">
      <CardContent className="p-4">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{label}</p>
        <p className="text-lg font-bold text-foreground mt-2">{value}</p>
      </CardContent>
    </Card>
  )
}

export default function GeracaoListasCard() {
  const params = useParams<{ id: string }>()
  const cardId = Number(params.id)
  const [, navigate] = useLocation()
  const queryClient = useQueryClient()

  const [file, setFile] = useState<File | null>(null)
  const [textoColado, setTextoColado] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const userQuery = useQuery({ queryKey: ['auth', 'me'], queryFn: getCurrentUser, staleTime: Infinity })

  const query = useQuery({
    queryKey: ['geracao-listas', 'card', cardId],
    queryFn: () => obterGeracaoListasCard(cardId),
    enabled: Number.isFinite(cardId),
  })

  const classificarMutation = useMutation({
    mutationFn: classificarGeracaoListasLista,
    onSuccess: () => {
      setFile(null)
      setTextoColado('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      queryClient.invalidateQueries({ queryKey: ['geracao-listas', 'card', cardId] })
      queryClient.invalidateQueries({ queryKey: ['geracao-listas', 'cards'] })
    },
  })

  const exportarMutation = useMutation({
    mutationFn: exportarGeracaoListasExcel,
    onSuccess: (data) => downloadBase64File(data.nomeArquivo, data.conteudoBase64),
  })

  const excluirMutation = useMutation({
    mutationFn: excluirGeracaoListasCard,
    onSuccess: () => navigate('/geracao-listas'),
  })

  async function handleClassificar() {
    if (!file && !textoColado.trim()) return

    if (file) {
      const arquivoBase64 = await lerArquivoBase64(file)
      classificarMutation.mutate({ cardId, arquivoBase64, nomeArquivo: file.name })
    } else {
      classificarMutation.mutate({ cardId, textoColado: textoColado.trim() })
    }
  }

  function handleExcluir() {
    if (!confirm('Excluir esta lista? Essa ação não pode ser desfeita.')) return
    excluirMutation.mutate(cardId)
  }

  const card = query.data
  const podeExcluir = !!userQuery.data && card != null && (userQuery.data.role === 'ADMIN' || card.createdBy === userQuery.data.name)

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <button
            onClick={() => navigate('/geracao-listas')}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao histórico
          </button>
          <h1 className="text-xl font-bold text-foreground">{card?.titulo || card?.segmento || 'Lista de prospecção'}</h1>
        </div>
        {podeExcluir && (
          <button
            onClick={handleExcluir}
            disabled={excluirMutation.isPending}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive disabled:opacity-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Excluir
          </button>
        )}
      </div>

      {query.isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      )}

      {query.error && !query.isLoading && (
        <Card className="border border-destructive/40 bg-card">
          <CardContent className="p-4 text-sm text-destructive">
            Não foi possível carregar a lista. {query.error.message}
          </CardContent>
        </Card>
      )}

      {card && (
        <>
          {card.briefing && (
            <Card className="border border-border bg-card">
              <CardHeader><CardTitle className="text-base">Briefing</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <p><span className="text-muted-foreground">Segmento: </span>{card.briefing.segmento}</p>
                <p><span className="text-muted-foreground">Aplicação: </span>{card.briefing.aplicacao}</p>
                <p><span className="text-muted-foreground">Quantidade: </span>{card.briefing.quantidade}</p>
                <p><span className="text-muted-foreground">Profundidade: </span>{card.briefing.profundidadePesquisa}</p>
                <p><span className="text-muted-foreground">Tipo de empresa: </span>{card.briefing.tipoEmpresa === 'somente_matriz' ? 'Somente matriz' : 'Matriz e filiais'}</p>
                {card.briefing.regiao && <p><span className="text-muted-foreground">Região: </span>{card.briefing.regiao}</p>}
                {card.briefing.porte && <p><span className="text-muted-foreground">Porte: </span>{card.briefing.porte}</p>}
                {card.briefing.lookAlike && <p><span className="text-muted-foreground">Look-alike: </span>{card.briefing.lookAlike}</p>}
              </CardContent>
            </Card>
          )}

          {card.promptTexto && (
            <Card className="border border-border bg-card">
              <CardHeader><CardTitle className="text-base">Prompt gerado</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <textarea readOnly value={card.promptTexto} rows={8}
                  className="w-full bg-background border border-input text-foreground rounded-md px-3 py-2 text-sm font-mono resize-y focus:outline-none" />
                {card.truncado && (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-600/40 bg-amber-600/10 px-3 py-2.5 text-sm text-amber-400">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Lista de exclusão atingiu o limite — esse segmento já tem bastante cobertura.</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {card.status !== 'LISTA_CLASSIFICADA' && (
            <Card className="border border-border bg-card">
              <CardHeader><CardTitle className="text-base">Upload da lista</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Envie o arquivo .xlsx gerado pela Manus, ou cole o texto/tabela diretamente.
                </p>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Arquivo (.xlsx)</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx"
                    onChange={(e) => { setFile(e.target.files?.[0] ?? null); setTextoColado('') }}
                    className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground file:px-3 file:py-2 file:text-sm file:font-medium"
                  />
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="h-px flex-1 bg-border" /> ou <div className="h-px flex-1 bg-border" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Colar texto / tabela</label>
                  <textarea
                    value={textoColado}
                    onChange={(e) => { setTextoColado(e.target.value); setFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                    rows={6}
                    placeholder="Cole aqui a tabela gerada pela Manus..."
                    className="w-full bg-background border border-input text-foreground placeholder-muted-foreground rounded-md px-3 py-2 text-sm resize-y focus:outline-none focus:border-primary"
                  />
                </div>

                {classificarMutation.isError && (
                  <p className="text-sm text-destructive">Não foi possível classificar a lista. Tente novamente.</p>
                )}

                <Button onClick={handleClassificar} disabled={(!file && !textoColado.trim()) || classificarMutation.isPending}>
                  <Upload className="w-4 h-4 mr-2" />
                  {classificarMutation.isPending ? 'Classificando...' : 'Classificar lista'}
                </Button>
              </CardContent>
            </Card>
          )}

          {card.status === 'LISTA_CLASSIFICADA' && card.avaliacao && (
            <>
              {card.avaliacao.saturacaoAlerta && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Mais de 60-70% da lista já é bloqueada ou precisa revisão — esse segmento pode estar saturado, considere mudar de segmento ou aplicação.</span>
                </div>
              )}

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatTile label="Total gerado" value={formatNumber(card.avaliacao.totalManus)} />
                <StatTile label="Livre" value={formatNumber(card.avaliacao.totalLivre)} />
                <StatTile label="Revisar" value={formatNumber(card.avaliacao.totalRevisar)} />
                <StatTile label="Bloqueada" value={formatNumber(card.avaliacao.totalBloqueada)} />
              </div>

              <Card className="border border-border bg-card">
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <CardTitle className="text-base">Itens classificados</CardTitle>
                    <Button size="sm" onClick={() => exportarMutation.mutate(cardId)} disabled={exportarMutation.isPending}>
                      <Download className="w-4 h-4 mr-2" />
                      {exportarMutation.isPending ? 'Gerando...' : 'Baixar Excel'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {exportarMutation.isError && (
                    <p className="text-sm text-destructive mb-3">Não foi possível gerar o Excel. Tente novamente.</p>
                  )}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Cidade</TableHead>
                        <TableHead>UF</TableHead>
                        <TableHead>Marca(s)</TableHead>
                        <TableHead>Classe</TableHead>
                        <TableHead>Motivo</TableHead>
                        <TableHead>Responsável</TableHead>
                        <TableHead>Possível duplicado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {card.itens.map((item, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{item.nome}</TableCell>
                          <TableCell className="text-muted-foreground">{item.cidade ?? '—'}</TableCell>
                          <TableCell className="text-muted-foreground">{item.uf ?? '—'}</TableCell>
                          <TableCell className="text-muted-foreground max-w-[160px] truncate" title={item.marca ?? undefined}>{item.marca ?? '—'}</TableCell>
                          <TableCell><ClasseBadge classe={item.classe} /></TableCell>
                          <TableCell className="text-muted-foreground max-w-xs whitespace-normal">{item.motivo}</TableCell>
                          <TableCell className="text-muted-foreground whitespace-nowrap">{item.responsavel ?? '—'}</TableCell>
                          <TableCell className="text-muted-foreground whitespace-normal">
                            {item.matchRefNome ? `${item.matchRefNome}${item.matchScore != null ? ` (${formatPercent(item.matchScore)})` : ''}` : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {card.itens.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8 flex items-center justify-center gap-2">
                      <FileSpreadsheet className="w-4 h-4" /> Nenhum item classificado.
                    </p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  )
}
