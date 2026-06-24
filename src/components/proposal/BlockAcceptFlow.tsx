'use client'

import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatMoney, totalesPorMoneda } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import type { Item } from '@/lib/types'

export function BlockAcceptFlow({
  slug,
  items,
  colorAcento,
  empresaNombre,
  clienteNombre,
}: {
  slug: string
  items: Item[]
  colorAcento: string
  empresaNombre: string
  clienteNombre: string
}) {
  const [seleccion, setSeleccion] = useState<Set<string>>(
    new Set(items.map((i) => i.id))
  )
  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [rechazoOpen, setRechazoOpen] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [resultado, setResultado] = useState<'aceptada' | 'rechazada' | null>(
    null
  )

  const elegidos = items.filter((i) => seleccion.has(i.id))
  const totales = totalesPorMoneda(elegidos)
  const totalLabel = [
    totales.ARS > 0 ? formatMoney(totales.ARS, 'ARS') : null,
    totales.USD > 0 ? formatMoney(totales.USD, 'USD') : null,
  ]
    .filter(Boolean)
    .join(' + ') || formatMoney(0, 'ARS')

  function toggle(id: string) {
    setSeleccion((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const hayExcluidos = elegidos.length < items.length

  async function aceptar() {
    setLoading(true)
    const res = await fetch(`/api/aceptar/${slug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bloquesAceptados: Array.from(seleccion),
        motivo: hayExcluidos ? motivo : '',
      }),
    })
    setLoading(false)
    setConfirmOpen(false)
    if (res.ok) {
      setResultado('aceptada')
    } else {
      const j = await res.json().catch(() => ({}))
      alert('No se pudo enviar tu respuesta: ' + (j.error ?? 'error desconocido'))
    }
  }

  async function rechazar() {
    setLoading(true)
    const res = await fetch(`/api/rechazar/${slug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ motivo }),
    })
    setLoading(false)
    setRechazoOpen(false)
    if (res.ok) {
      setResultado('rechazada')
    } else {
      const j = await res.json().catch(() => ({}))
      alert('No se pudo enviar tu respuesta: ' + (j.error ?? 'error desconocido'))
    }
  }

  if (resultado === 'aceptada') {
    return (
      <div className="mt-8 rounded-lg border border-green-200 bg-green-50 px-5 py-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <Check className="h-6 w-6 text-green-600" />
        </div>
        <p className="text-lg font-semibold text-green-800">
          ¡Recibimos tu selección!
        </p>
        <p className="mt-1 text-sm text-green-700">
          {empresaNombre || 'La agencia'} va a revisar los bloques que elegiste y
          te va a contactar para confirmar.
        </p>
      </div>
    )
  }

  if (resultado === 'rechazada') {
    return (
      <div className="mt-8 rounded-lg border bg-muted/40 px-5 py-6 text-center">
        <p className="font-medium">Registramos tu respuesta.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Gracias por tomarte el tiempo de revisar la propuesta.
        </p>
      </div>
    )
  }

  return (
    <div>
      <hr className="my-6" />
      <div className="mb-4 flex items-center justify-between">
        <h2
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: colorAcento }}
        >
          Servicios
        </h2>
        <span className="text-xs text-muted-foreground">
          Elegí qué incluir
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {items.map((item) => {
          const sel = seleccion.has(item.id)
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => toggle(item.id)}
              className={cn(
                'flex items-start justify-between gap-4 rounded-lg border p-3 text-left transition-colors',
                sel ? 'bg-background' : 'border-dashed bg-muted/30 opacity-70'
              )}
              style={sel ? { borderColor: colorAcento } : undefined}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border',
                    sel ? 'text-white' : 'bg-background'
                  )}
                  style={
                    sel
                      ? { backgroundColor: colorAcento, borderColor: colorAcento }
                      : undefined
                  }
                >
                  {sel ? <Check className="h-3.5 w-3.5" /> : null}
                </span>
                <div className="min-w-0">
                  <p className="font-medium">{item.nombre}</p>
                  {item.descripcion ? (
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {item.descripcion}
                    </p>
                  ) : null}
                </div>
              </div>
              <span className="whitespace-nowrap font-medium">
                {formatMoney(Number(item.precio), item.moneda)}
              </span>
            </button>
          )
        })}
      </div>

      {/* Total seleccionado */}
      <div className="mt-6 flex items-center justify-between border-t pt-4">
        <span className="text-sm text-muted-foreground">
          Total seleccionado
        </span>
        <span className="text-xl font-bold" style={{ color: colorAcento }}>
          {totalLabel}
        </span>
      </div>

      {/* Acciones */}
      <div className="mt-8 space-y-3">
        <Button
          size="lg"
          className="h-14 w-full text-base text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: colorAcento }}
          onClick={() => setConfirmOpen(true)}
          disabled={elegidos.length === 0}
        >
          Aceptar {elegidos.length} de {items.length} bloques
        </Button>
        <div className="text-center">
          <button
            onClick={() => setRechazoOpen(true)}
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Prefiero no aceptar
          </button>
        </div>
      </div>

      {/* Modal confirmar */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar selección</DialogTitle>
            <DialogDescription>
              {clienteNombre ? `${clienteNombre}, vas` : 'Vas'} a aceptar{' '}
              {elegidos.length} bloque{elegidos.length === 1 ? '' : 's'} por{' '}
              <strong>{totalLabel}</strong>.
            </DialogDescription>
          </DialogHeader>
          {hayExcluidos ? (
            <div className="space-y-1.5">
              <p className="text-sm text-muted-foreground">
                Dejás afuera {items.length - elegidos.length} bloque
                {items.length - elegidos.length === 1 ? '' : 's'}. ¿Nos contás por
                qué? (opcional)
              </p>
              <Textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ej: por ahora solo necesito el desarrollo, la capacitación queda para más adelante."
                rows={3}
              />
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: colorAcento }}
              onClick={aceptar}
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal rechazo con motivo */}
      <Dialog open={rechazoOpen} onOpenChange={setRechazoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Preferís no aceptar</DialogTitle>
            <DialogDescription>
              ¿Nos contás por qué? Tu respuesta ayuda a mejorar la propuesta
              (opcional).
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Motivo (opcional)"
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRechazoOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={rechazar}
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Enviar respuesta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
