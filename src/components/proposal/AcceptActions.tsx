'use client'

import { useState } from 'react'
import { Loader2, Download, Check } from 'lucide-react'
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

export function AcceptActions({
  slug,
  propuestaId,
  clienteNombre,
  montoLabel,
  empresaNombre,
  colorAcento = '#16a34a',
}: {
  slug: string
  propuestaId: string
  clienteNombre: string
  montoLabel: string
  empresaNombre: string
  colorAcento?: string
}) {
  const [open, setOpen] = useState(false)
  const [rechazoOpen, setRechazoOpen] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<'aceptada' | 'rechazada' | null>(
    null
  )

  async function aceptar() {
    setLoading(true)
    const res = await fetch(`/api/aceptar/${slug}`, { method: 'POST' })
    setLoading(false)
    setOpen(false)
    if (res.ok) {
      setResultado('aceptada')
    } else {
      const j = await res.json().catch(() => ({}))
      alert('No se pudo aceptar: ' + (j.error ?? 'error desconocido'))
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
    if (res.ok) setResultado('rechazada')
    else alert('Hubo un problema al enviar tu respuesta. Intentá de nuevo.')
  }

  if (resultado === 'aceptada') {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 px-5 py-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <Check className="h-6 w-6 text-green-600" />
        </div>
        <p className="text-lg font-semibold text-green-800">
          ¡Propuesta aceptada!
        </p>
        <p className="mt-1 text-sm text-green-700">
          {empresaNombre || 'La agencia'} te contactará pronto.
        </p>
      </div>
    )
  }

  if (resultado === 'rechazada') {
    return (
      <div className="rounded-lg border bg-muted/40 px-5 py-6 text-center">
        <p className="font-medium">Registramos tu respuesta.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Gracias por tomarte el tiempo de revisar la propuesta.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <Button
        size="lg"
        className="h-14 w-full text-base text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: colorAcento }}
        onClick={() => setOpen(true)}
      >
        Aceptar propuesta
      </Button>

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <a href={`/api/pdf/${propuestaId}`} target="_blank" rel="noreferrer">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Descargar PDF
          </Button>
        </a>
        <button
          onClick={() => setRechazoOpen(true)}
          disabled={loading}
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Prefiero no aceptar
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar aceptación</DialogTitle>
            <DialogDescription>
              {clienteNombre ? `${clienteNombre}, estás` : 'Estás'} a punto de
              aceptar esta propuesta por <strong>{montoLabel}</strong>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: colorAcento }}
              onClick={aceptar}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Confirmar aceptación
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
            <Button variant="destructive" onClick={rechazar} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Enviar respuesta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
