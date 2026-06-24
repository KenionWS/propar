import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Estado } from '@/lib/types'

const CONFIG: Record<Estado, { label: string; className: string }> = {
  borrador: {
    label: 'Borrador',
    className: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
  },
  enviada: {
    label: 'Enviada',
    className: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  },
  vista: {
    label: 'Vista',
    className: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
  },
  aceptada: {
    label: 'Aceptada',
    className: 'bg-green-100 text-green-700 hover:bg-green-100',
  },
  aceptada_parcial: {
    label: 'Aceptada (parcial)',
    className: 'bg-teal-100 text-teal-700 hover:bg-teal-100',
  },
  rechazada: {
    label: 'Rechazada',
    className: 'bg-red-100 text-red-700 hover:bg-red-100',
  },
}

export function StatusBadge({
  estado,
  vencida,
}: {
  estado: Estado
  vencida?: boolean
}) {
  if (vencida && estado !== 'aceptada' && estado !== 'rechazada') {
    return (
      <Badge
        variant="secondary"
        className="bg-red-50 text-red-600 hover:bg-red-50"
      >
        Vencida
      </Badge>
    )
  }
  const cfg = CONFIG[estado]
  return (
    <Badge variant="secondary" className={cn(cfg.className)}>
      {cfg.label}
    </Badge>
  )
}
