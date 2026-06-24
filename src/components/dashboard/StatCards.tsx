import { Card, CardContent } from '@/components/ui/card'
import { Send, TrendingUp, Wallet, Clock } from 'lucide-react'

export interface Stats {
  enviadasMes: number
  tasaCierre: number // porcentaje 0-100
  pipelineLabel: string
  tiempoRespuestaDias: number | null
}

export function StatCards({ stats }: { stats: Stats }) {
  const cards = [
    {
      label: 'Enviadas este mes',
      value: String(stats.enviadasMes),
      icon: Send,
    },
    {
      label: 'Tasa de cierre (30d)',
      value: `${Math.round(stats.tasaCierre)}%`,
      icon: TrendingUp,
    },
    {
      label: 'Valor en pipeline',
      value: stats.pipelineLabel,
      icon: Wallet,
    },
    {
      label: 'Resp. promedio',
      value:
        stats.tiempoRespuestaDias === null
          ? '—'
          : `${stats.tiempoRespuestaDias.toFixed(1)} d`,
      icon: Clock,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon
        return (
          <Card key={c.label}>
            <CardContent className="flex flex-col gap-2 p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{c.label}</span>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="text-2xl font-semibold tracking-tight">
                {c.value}
              </span>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
