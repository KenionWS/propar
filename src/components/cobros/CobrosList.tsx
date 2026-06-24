import Link from 'next/link'
import {
  Wallet,
  Clock,
  CalendarClock,
  AlertTriangle,
  ChevronRight,
  FileText,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import {
  calcularCobrosStats,
  sumarPorMoneda,
  formatMontos,
} from '@/lib/cobros'
import { cn } from '@/lib/utils'
import type { Propuesta, Item, Pago } from '@/lib/types'

type PropConItems = Propuesta & { items: Item[] }

export function CobrosList({
  propuestas,
  pagos,
}: {
  propuestas: PropConItems[]
  pagos: Pago[]
}) {
  const stats = calcularCobrosStats(pagos)

  const pagosPorProp = new Map<string, Pago[]>()
  for (const p of pagos) {
    const arr = pagosPorProp.get(p.propuesta_id) ?? []
    arr.push(p)
    pagosPorProp.set(p.propuesta_id, arr)
  }

  if (propuestas.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 py-16 text-center">
        <Wallet className="h-10 w-10 text-muted-foreground/40" />
        <div>
          <p className="font-medium">Todavía no hay propuestas cerradas</p>
          <p className="text-sm text-muted-foreground">
            Cuando una propuesta sea aceptada, vas a poder cargar su plan de pagos
            acá.
          </p>
        </div>
      </Card>
    )
  }

  const statCards = [
    { label: 'Cobrado', value: stats.cobrado, icon: Wallet },
    { label: 'Pendiente', value: stats.pendiente, icon: Clock },
    { label: 'A cobrar este mes', value: stats.esteMes, icon: CalendarClock },
    {
      label: 'Vencido',
      value: stats.vencido,
      icon: AlertTriangle,
      alerta: stats.hayVencidas,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((c) => {
          const Icon = c.icon
          return (
            <Card key={c.label}>
              <CardContent className="flex flex-col gap-2 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {c.label}
                  </span>
                  <Icon
                    className={cn(
                      'h-4 w-4 text-muted-foreground',
                      c.alerta && 'text-red-500'
                    )}
                  />
                </div>
                <span
                  className={cn(
                    'text-xl font-semibold tracking-tight',
                    c.alerta && 'text-red-600'
                  )}
                >
                  {c.value}
                </span>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="divide-y overflow-hidden">
        {propuestas.map((prop) => {
          const ps = pagosPorProp.get(prop.id) ?? []
          const pagadas = ps.filter((p) => p.pagado)
          const tienePlan = ps.length > 0
          const cobrado = sumarPorMoneda(pagadas)
          const total = sumarPorMoneda(ps)
          const progreso =
            ps.length > 0 ? (pagadas.length / ps.length) * 100 : 0

          return (
            <Link
              key={prop.id}
              href={`/cobros/${prop.id}`}
              className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/40"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {prop.titulo || 'Sin título'}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {prop.cliente_nombre}
                  {prop.cliente_empresa ? ` · ${prop.cliente_empresa}` : ''}
                </p>
              </div>

              <div className="hidden w-56 sm:block">
                {tienePlan ? (
                  <>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {pagadas.length}/{ps.length} cuotas
                      </span>
                      <span className="font-medium">
                        {formatMontos(cobrado)} / {formatMontos(total)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-green-500"
                        style={{ width: `${progreso}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <FileText className="h-3.5 w-3.5" />
                    Sin plan de pagos
                  </span>
                )}
              </div>

              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          )
        })}
      </Card>
    </div>
  )
}
