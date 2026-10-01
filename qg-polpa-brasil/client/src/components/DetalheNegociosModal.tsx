import { useQuery, type QueryKey } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { formatCurrency, formatData } from '../lib/utils'
import type { DetalheNegocioRow } from '../lib/api'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function formatDataCelula(data: string | null) {
  if (!data) return '—'
  return ISO_DATE.test(data) ? formatData(data) : data
}

// Modal genérico de drill-down: usado em Panorama CRM e Scorecard pra mostrar quais
// negócios/leads compõem uma célula numérica clicada — dá ao usuário uma forma de
// auditar os números na própria tela, sem precisar de acesso ao banco.
export default function DetalheNegociosModal({
  open, onClose, title, queryKey, queryFn,
}: {
  open: boolean
  onClose: () => void
  title: string
  queryKey: QueryKey
  queryFn: () => Promise<DetalheNegocioRow[]>
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn,
    enabled: open,
    staleTime: 30_000,
  })

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle>{title}</DialogTitle>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
          {!isLoading && !isError && data && (
            <p className="text-xs text-muted-foreground">{data.length} {data.length === 1 ? 'registro' : 'registros'}</p>
          )}
        </DialogHeader>

        {isLoading && <p className="text-sm text-muted-foreground py-8 text-center">Carregando...</p>}
        {isError && <p className="text-sm text-destructive py-8 text-center">Não foi possível carregar os dados.</p>}

        {!isLoading && !isError && data && (
          data.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhum registro encontrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Negócio / Lead</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Etapa</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map(row => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium max-w-[220px] truncate" title={row.titulo}>{row.titulo}</TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">{row.vendedor}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">{row.valor != null ? formatCurrency(row.valor) : '—'}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[150px] truncate" title={row.etapa ?? undefined}>{row.etapa ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap shrink-0">{formatDataCelula(row.data)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )
        )}
      </DialogContent>
    </Dialog>
  )
}
