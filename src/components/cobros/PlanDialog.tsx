'use client'

import { useState } from 'react'
import { addMonths, format } from 'date-fns'
import { toast } from 'sonner'
import { Plus, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CurrencyToggle } from '@/components/editor/CurrencyToggle'
import { formatMoney } from '@/lib/formatters'
import type { Propuesta, Item, Pago, Moneda } from '@/lib/types'

type PropConItems = Propuesta & { items: Item[] }

export function PlanDialog({
  userId,
  propuesta,
  onCreated,
}: {
  userId: string
  propuesta: PropConItems
  onCreated: (nuevos: Pago[]) => void
}) {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const totalSugerido = (propuesta.items ?? [])
    .filter((i) => i.aceptado !== false)
    .reduce((a, i) => a + Number(i.precio), 0)

  const [monto, setMonto] = useState<number>(totalSugerido)
  const [cuotas, setCuotas] = useState<number>(1)
  const [moneda, setMoneda] = useState<Moneda>(propuesta.moneda)
  const [inicio, setInicio] = useState<string>(
    new Date().toISOString().slice(0, 10)
  )

  async function guardar() {
    if (monto <= 0) {
      toast.error('Poné un monto por cuota mayor a cero.')
      return
    }
    if (cuotas < 1) {
      toast.error('La cantidad de cuotas debe ser al menos 1.')
      return
    }
    setSaving(true)
    const base = new Date(inicio + 'T00:00:00')
    const filas = Array.from({ length: cuotas }, (_, i) => ({
      propuesta_id: propuesta.id,
      user_id: userId,
      numero: i + 1,
      monto,
      moneda,
      vencimiento: format(addMonths(base, i), 'yyyy-MM-dd'),
      pagado: false,
    }))

    const { data, error } = await supabase
      .from('pagos')
      .insert(filas)
      .select('*')
    setSaving(false)
    if (error) {
      toast.error('Error al crear el plan: ' + error.message)
      return
    }
    onCreated((data ?? []) as Pago[])
    setOpen(false)
    toast.success('Plan de pagos creado.')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Configurar plan de pagos
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Plan de pagos</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="monto">Monto por cuota</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>
                <Input
                  id="monto"
                  type="number"
                  min={0}
                  value={monto === 0 ? '' : monto}
                  onChange={(e) => setMonto(parseFloat(e.target.value) || 0)}
                  className="w-40 pl-7"
                />
              </div>
            </div>
            <CurrencyToggle value={moneda} onChange={setMoneda} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cuotas">Cantidad de cuotas</Label>
              <Input
                id="cuotas"
                type="number"
                min={1}
                value={cuotas}
                onChange={(e) =>
                  setCuotas(Math.max(1, parseInt(e.target.value) || 1))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inicio">Primera cuota</Label>
              <Input
                id="inicio"
                type="date"
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
              />
            </div>
          </div>

          <p className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
            {cuotas} cuota{cuotas === 1 ? '' : 's'} de{' '}
            <strong className="text-foreground">
              {formatMoney(monto, moneda)}
            </strong>{' '}
            ={' '}
            <strong className="text-foreground">
              {formatMoney(monto * cuotas, moneda)}
            </strong>{' '}
            en total.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={guardar} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Crear plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
