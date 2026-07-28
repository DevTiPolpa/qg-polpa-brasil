import { useState } from 'react'
import { useLocation } from 'wouter'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, Search } from 'lucide-react'
import { buscarGeracaoListasEmpresa } from '../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { ClasseBadge } from '../components/GeracaoListasUi'
import { formatPercent } from '../lib/utils'

export default function GeracaoListasBuscar() {
  const [, navigate] = useLocation()
  const [nome, setNome] = useState('')
  const [cnpj, setCnpj] = useState('')

  const mutation = useMutation({ mutationFn: buscarGeracaoListasEmpresa })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return
    mutation.mutate({ nome: nome.trim(), cnpj: cnpj.trim() || undefined })
  }

  const resultado = mutation.data

  return (
    <div className="space-y-6 fade-in max-w-3xl">
      <div>
        <button
          onClick={() => navigate('/geracao-listas')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao histórico
        </button>
        <h1 className="text-xl font-bold text-foreground">Busca avulsa</h1>
        <p className="text-sm text-muted-foreground">Verifique se uma empresa já é cliente ou já está no CRM.</p>
      </div>

      <Card className="border border-border bg-card">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px] space-y-1.5">
              <label className="text-sm font-medium text-foreground">Nome da empresa</label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Indústria Alfa Ltda" autoFocus />
            </div>
            <div className="w-48 space-y-1.5">
              <label className="text-sm font-medium text-foreground">CNPJ (opcional)</label>
              <Input value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" />
            </div>
            <Button type="submit" disabled={!nome.trim() || mutation.isPending}>
              <Search className="w-4 h-4 mr-2" />
              {mutation.isPending ? 'Buscando...' : 'Buscar'}
            </Button>
          </form>
          {mutation.isError && (
            <p className="text-sm text-destructive mt-3">Não foi possível buscar. Tente novamente.</p>
          )}
        </CardContent>
      </Card>

      {resultado && (
        <>
          <Card className="border border-border bg-card">
            <CardHeader><CardTitle className="text-base">Veredito</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <ClasseBadge classe={resultado.veredito.classe} />
              <p className="text-sm text-foreground">{resultado.veredito.motivo}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground pt-2">
                {resultado.veredito.matchRefNome && <p><span className="text-foreground">Cadastrada como: </span>{resultado.veredito.matchRefNome}</p>}
                {resultado.veredito.fonteBloqueio && <p><span className="text-foreground">Fonte: </span>{resultado.veredito.fonteBloqueio}</p>}
                {resultado.veredito.responsavel && <p><span className="text-foreground">Responsável: </span>{resultado.veredito.responsavel}</p>}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card">
            <CardHeader><CardTitle className="text-base">Candidatos parecidos</CardTitle></CardHeader>
            <CardContent>
              {resultado.candidatos.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">Nenhum candidato parecido encontrado.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Fonte</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead className="text-right">Similaridade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resultado.candidatos.map((c, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{c.nomeOriginal}</TableCell>
                        <TableCell className="text-muted-foreground">{c.fonte}</TableCell>
                        <TableCell className="text-muted-foreground">{c.responsavel ?? '—'}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatPercent(c.score)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
