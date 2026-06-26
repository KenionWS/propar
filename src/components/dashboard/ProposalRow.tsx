'use client'

import Link from 'next/link'
import { toast } from 'sonner'
import { Copy, Eye, Pencil } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { StatusBadge } from './StatusBadge'
import type { Propuesta } from '@/lib/types'
import {
  formatTotales,
  formatTotalesIncluidos,
  formatRelativeTime,
  getIniciales,
  colorDesdeNombre,
  isVencida,
} from '@/lib/formatters'

function vistaHaceMenosDe2h(propuesta: Propuesta): boolean {
  if (propuesta.estado !== 'vista' || !propuesta.vista_primera_vez_at) return false
  const diff = Date.now() - new Date(propuesta.vista_primera_vez_at).getTime()
  return diff < 2 * 60 * 60 * 1000
}

export function ProposalRow({ propuesta }: { propuesta: Propuesta }) {
  const iniciales = getIniciales(propuesta.cliente_nombre)
  const color = colorDesdeNombre(propuesta.cliente_nombre)
  const cerrada =
    propuesta.estado === 'aceptada' || propuesta.estado === 'aceptada_parcial'
  const total = cerrada
    ? formatTotalesIncluidos(propuesta.items ?? [])
    : formatTotales(propuesta.items ?? [])
  const vencida = isVencida(propuesta)
  const recienVista = vistaHaceMenosDe2h(propuesta)

  function copiarLink() {
    const url = `${window.location.origin}/p/${propuesta.slug}`
    navigator.clipboard.writeText(url)
    toast.success('Link copiado al portapapeles')
  }

  const fechaRef =
    propuesta.estado === 'vista' && propuesta.vista_primera_vez_at
      ? propuesta.vista_primera_vez_at
      : propuesta.enviada_at || propuesta.created_at

  return (
    <div className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/40">
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarFallback
          style={{ backgroundColor: color, color: 'white' }}
          className="text-xs font-semibold"
        >
          {iniciales}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">
            {propuesta.cliente_nombre}
          </span>
          {propuesta.cliente_empresa ? (
            <span className="truncate text-sm text-muted-foreground">
              · {propuesta.cliente_empresa}
            </span>
          ) : null}
        </div>
        <p className="truncate text-sm text-muted-foreground">
          {propuesta.titulo || 'Sin título'}
        </p>
        {propuesta.estado === 'vista' && propuesta.vista_primera_vez_at ? (
          <p
            className={
              recienVista
                ? 'mt-0.5 flex items-center gap-1 text-xs font-medium text-brand-accent'
                : 'mt-0.5 text-xs text-muted-foreground'
            }
          >
            {recienVista ? (
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-accent" />
            ) : null}
            Vista {formatRelativeTime(propuesta.vista_primera_vez_at)}
          </p>
        ) : null}
      </div>

      <div className="hidden text-right sm:block">
        <p className="font-medium">{total}</p>
        <p className="text-xs text-muted-foreground">
          {formatRelativeTime(fechaRef)}
        </p>
      </div>

      <div className="w-24 text-center">
        <StatusBadge estado={propuesta.estado} vencida={vencida} />
      </div>

      <div className="flex items-center gap-1">
        {propuesta.estado !== 'borrador' ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={copiarLink}
            title="Copiar link"
          >
            <Copy className="h-4 w-4" />
          </Button>
        ) : null}
        {propuesta.estado !== 'borrador' ? (
          <Button variant="ghost" size="icon" asChild title="Ver propuesta">
            <Link href={`/p/${propuesta.slug}`} target="_blank">
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
        ) : null}
        <Button variant="ghost" size="icon" asChild title="Editar">
          <Link href={`/propuestas/${propuesta.id}`}>
            <Pencil className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
