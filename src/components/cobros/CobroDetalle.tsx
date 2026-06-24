'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Check,
  Loader2,
  RefreshCw,
  Receipt,
  Send,
  FileText,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { StatusBadge } from '@/components/dashboard/StatusBadge'
import { PlanDialog } from './PlanDialog'
import { formatMoney } from '@/lib/formatters'
import { labelDocumento } from '@/lib/afip'
import {
  estadoCuota,
  formatVencimiento,
  sumarPorMoneda,
  formatMontos,
  type EstadoCuota,
} from '@/lib/cobros'
import { cn } from '@/lib/utils'
import type { Propuesta, Item, Pago, FacturaEstado } from '@/lib/types'

type PropConItems = Propuesta & { items: Item[] }

export function CobroDetalle({
  userId,
  propuesta,
  pagosIniciales,
}: {
  userId: string
  propuesta: PropConItems
  pagosIniciales: Pago[]
}) {
  const supabase = createClient()
  const [pagos, setPagos] = useState<Pago[]>(pagosIniciales)
  const [revertTarget, setRevertTarget] = useState<Pago | null>(null)
  const [facturando, setFacturando] = useState<string | null>(null)
  const [documento, setDocumento] = useState(propuesta.cliente_documento ?? '')
  const [guardandoDoc, setGuardandoDoc] = useState(false)

  async function guardarDocumento() {
    setGuardandoDoc(true)
    const { error } = await supabase
      .from('propuestas')
      .update({ cliente_documento: documento.trim() || null })
      .eq('id', propuesta.id)
    setGuardandoDoc(false)
    if (error) {
      toast.error('Error: ' + error.message)
      return
    }
    toast.success('Datos de facturación guardados.')
  }

  const tienePlan = pagos.length > 0
  const pagadas = pagos.filter((p) => p.pagado)
  const total = sumarPorMoneda(pagos)
  const cobrado = sumarPorMoneda(pagadas)
  const progreso = pagos.length > 0 ? (pagadas.length / pagos.length) * 100 : 0

  function patchPago(id: string, patch: Partial<Pago>) {
    setPagos((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }

  // Marcar pagada — directo y fácil
  async function marcarPagada(pago: Pago) {
    const pagadoAt = new Date().toISOString()
    patchPago(pago.id, { pagado: true, pagado_at: pagadoAt })
    const { error } = await supabase
      .from('pagos')
      .update({ pagado: true, pagado_at: pagadoAt })
      .eq('id', pago.id)
    if (error) {
      toast.error('Error: ' + error.message)
      patchPago(pago.id, { pagado: false, pagado_at: null })
    }
  }

  // Revertir — solo tras confirmar (para no destildar por accidente)
  async function confirmarRevertir() {
    if (!revertTarget) return
    const pago = revertTarget
    setRevertTarget(null)
    patchPago(pago.id, { pagado: false, pagado_at: null })
    const { error } = await supabase
      .from('pagos')
      .update({ pagado: false, pagado_at: null })
      .eq('id', pago.id)
    if (error) {
      toast.error('Error: ' + error.message)
      patchPago(pago.id, { pagado: true, pagado_at: pago.pagado_at })
    }
  }

  function onClickCuota(pago: Pago) {
    if (pago.pagado) setRevertTarget(pago)
    else marcarPagada(pago)
  }

  async function facturar(pago: Pago) {
    setFacturando(pago.id)
    const res = await fetch(`/api/facturar/${pago.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'facturar' }),
    })
    setFacturando(null)
    const j = await res.json().catch(() => ({}))
    if (res.ok && j.ok) {
      patchPago(pago.id, {
        factura_estado: 'facturada',
        factura_numero: j.numero ?? null,
        factura_cae: j.cae ?? null,
        factura_url: j.url ?? null,
      })
      toast.success('Factura emitida.')
    } else {
      console.error('[facturar] respuesta:', j)
      toast.error(j.error ?? 'No se pudo facturar.', { duration: 15000 })
    }
  }

  async function enviarFactura(pago: Pago) {
    setFacturando(pago.id)
    const res = await fetch(`/api/facturar/${pago.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'enviar' }),
    })
    setFacturando(null)
    const j = await res.json().catch(() => ({}))
    if (res.ok && j.ok) {
      patchPago(pago.id, { factura_estado: 'enviada' })
      toast.success('Factura enviada al cliente.')
    } else {
      toast.error(j.error ?? 'No se pudo enviar.')
    }
  }

  async function reconfigurar() {
    if (!confirm('¿Borrar el plan de pagos de esta propuesta?')) return
    const { error } = await supabase
      .from('pagos')
      .delete()
      .eq('propuesta_id', propuesta.id)
    if (error) {
      toast.error('Error: ' + error.message)
      return
    }
    setPagos([])
    toast.success('Plan eliminado. Podés configurar uno nuevo.')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/cobros">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-xl font-bold tracking-tight">
              {propuesta.titulo || 'Sin título'}
            </h1>
            <StatusBadge estado={propuesta.estado} />
          </div>
          <p className="text-sm text-muted-foreground">
            {propuesta.cliente_nombre}
            {propuesta.cliente_empresa ? ` · ${propuesta.cliente_empresa}` : ''}
          </p>
        </div>
      </div>

      {/* Datos de facturación */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos de facturación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="documento">CUIT / CUIL / DNI del cliente</Label>
              <Input
                id="documento"
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
                placeholder="20-12345678-9"
                className="w-56"
              />
            </div>
            <Button
              variant="outline"
              onClick={guardarDocumento}
              disabled={guardandoDoc}
              className="gap-2"
            >
              {guardandoDoc ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Guardar
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Se factura a{' '}
            <strong className="text-foreground">
              {labelDocumento(documento)}
            </strong>
            . Si lo dejás vacío, se factura a Consumidor Final.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Plan de pagos</CardTitle>
          {tienePlan ? (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              onClick={reconfigurar}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reconfigurar
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {!tienePlan ? (
            <div className="flex flex-col items-start gap-3 py-4">
              <p className="text-sm text-muted-foreground">
                Esta propuesta todavía no tiene plan de pagos. Configurá el monto
                por cuota y la cantidad de meses.
              </p>
              <PlanDialog
                userId={userId}
                propuesta={propuesta}
                onCreated={(nuevos) => setPagos(nuevos)}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Progreso */}
              <div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {pagadas.length} de {pagos.length} cuotas pagadas
                  </span>
                  <span className="font-medium">
                    {formatMontos(cobrado)} / {formatMontos(total)}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all"
                    style={{ width: `${progreso}%` }}
                  />
                </div>
              </div>

              {/* Cuotas */}
              <div className="space-y-2">
                {pagos.map((pago) => {
                  const est = estadoCuota(pago)
                  return (
                    <div
                      key={pago.id}
                      className={cn(
                        'flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3',
                        pago.pagado
                          ? 'border-green-200 bg-green-50'
                          : est === 'vencido'
                            ? 'border-red-200 bg-red-50'
                            : ''
                      )}
                    >
                      {/* Toggle pagado */}
                      <button
                        type="button"
                        onClick={() => onClickCuota(pago)}
                        className="flex items-center gap-3 text-left"
                      >
                        <span
                          className={cn(
                            'flex h-6 w-6 items-center justify-center rounded-full border text-xs',
                            pago.pagado
                              ? 'border-green-500 bg-green-500 text-white'
                              : 'bg-background'
                          )}
                        >
                          {pago.pagado ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            pago.numero
                          )}
                        </span>
                        <div>
                          <p className="text-sm font-medium">
                            Cuota {pago.numero} ·{' '}
                            {formatMoney(Number(pago.monto), pago.moneda)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Vence {formatVencimiento(pago.vencimiento)}
                          </p>
                        </div>
                      </button>

                      {/* Estado + facturación */}
                      <div className="flex items-center gap-2">
                        <CuotaEstadoBadge estado={est} />
                        <FacturaAcciones
                          pago={pago}
                          loading={facturando === pago.id}
                          onFacturar={() => facturar(pago)}
                          onEnviar={() => enviarFactura(pago)}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              <p className="text-xs text-muted-foreground">
                Tocá una cuota para marcarla pagada. Para revertir un pago ya
                marcado, te va a pedir confirmación.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmación para revertir un pago */}
      <Dialog
        open={revertTarget !== null}
        onOpenChange={(o) => !o && setRevertTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Marcar la cuota como impaga?</DialogTitle>
            <DialogDescription>
              {revertTarget
                ? `Vas a revertir el pago de la cuota ${revertTarget.numero} (${formatMoney(
                    Number(revertTarget.monto),
                    revertTarget.moneda
                  )}). Esto es solo por si te equivocaste.`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevertTarget(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmarRevertir}>
              Sí, marcar impaga
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CuotaEstadoBadge({ estado }: { estado: EstadoCuota }) {
  const map: Record<EstadoCuota, { label: string; className: string }> = {
    pagado: {
      label: 'Pagada',
      className: 'bg-green-100 text-green-700 hover:bg-green-100',
    },
    vencido: {
      label: 'Vencida',
      className: 'bg-red-100 text-red-700 hover:bg-red-100',
    },
    pendiente: {
      label: 'Pendiente',
      className: 'bg-gray-100 text-gray-600 hover:bg-gray-100',
    },
  }
  const c = map[estado]
  return (
    <Badge variant="secondary" className={c.className}>
      {c.label}
    </Badge>
  )
}

function FacturaAcciones({
  pago,
  loading,
  onFacturar,
  onEnviar,
}: {
  pago: Pago
  loading: boolean
  onFacturar: () => void
  onEnviar: () => void
}) {
  const estado: FacturaEstado = pago.factura_estado
  const facturada = estado === 'facturada' || estado === 'enviada'

  const verBtn = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-muted-foreground"
      title={facturada ? 'Ver factura' : 'Ver borrador'}
      onClick={() => window.open(`/api/factura-pdf/${pago.id}`, '_blank')}
    >
      <FileText className="h-4 w-4" />
    </Button>
  )

  if (estado === 'enviada') {
    return (
      <div className="flex items-center gap-1">
        <Badge
          variant="secondary"
          className="gap-1 bg-blue-100 text-blue-700 hover:bg-blue-100"
        >
          <Send className="h-3 w-3" /> Enviada
        </Badge>
        {verBtn}
      </div>
    )
  }

  if (estado === 'facturada') {
    return (
      <div className="flex items-center gap-1">
        <Badge
          variant="secondary"
          className="bg-blue-50 text-blue-700 hover:bg-blue-50"
        >
          Facturada{pago.factura_numero ? ` ${pago.factura_numero}` : ''}
        </Badge>
        {verBtn}
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={onEnviar}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
          Enviar
        </Button>
      </div>
    )
  }

  // pendiente / error
  return (
    <div className="flex items-center gap-1">
      {verBtn}
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={onFacturar}
        disabled={loading}
        title="Emitir factura (AFIP)"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Receipt className="h-3.5 w-3.5" />
        )}
        Facturar
      </Button>
    </div>
  )
}
