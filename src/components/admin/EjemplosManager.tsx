'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Loader2, Boxes } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CurrencyToggle } from '@/components/editor/CurrencyToggle'
import { CaracteristicasEditor } from '@/components/editor/CaracteristicasEditor'
import { formatMoney } from '@/lib/formatters'
import type {
  Rubro,
  Servicio,
  BloqueEjemplo,
  Moneda,
  Caracteristica,
} from '@/lib/types'

interface FormState {
  servicio_id: string
  nombre: string
  descripcion: string
  precio: number
  moneda: Moneda
  caracteristicas: Caracteristica[]
}

const EMPTY: FormState = {
  servicio_id: '',
  nombre: '',
  descripcion: '',
  precio: 0,
  moneda: 'ARS',
  caracteristicas: [],
}

export function EjemplosManager({
  rubros,
  servicios,
  ejemplos: ejemplosIniciales,
}: {
  rubros: Rubro[]
  servicios: Servicio[]
  ejemplos: BloqueEjemplo[]
}) {
  const supabase = createClient()
  const [ejemplos, setEjemplos] = useState<BloqueEjemplo[]>(ejemplosIniciales)
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)

  const rubroDe = useMemo(() => {
    const m = new Map<string, string>()
    for (const s of servicios) {
      const r = rubros.find((x) => x.id === s.rubro_id)
      m.set(s.id, r?.nombre ?? '—')
    }
    return m
  }, [servicios, rubros])

  function servicioLabel(servicioId: string): string {
    const s = servicios.find((x) => x.id === servicioId)
    if (!s) return '—'
    return `${rubroDe.get(s.id)} › ${s.nombre}`
  }

  function abrirNuevo() {
    setEditId(null)
    setForm({ ...EMPTY, servicio_id: servicios[0]?.id ?? '' })
    setOpen(true)
  }
  function abrirEditar(b: BloqueEjemplo) {
    setEditId(b.id)
    setForm({
      servicio_id: b.servicio_id,
      nombre: b.nombre,
      descripcion: b.descripcion ?? '',
      precio: Number(b.precio),
      moneda: b.moneda,
      caracteristicas: b.caracteristicas ?? [],
    })
    setOpen(true)
  }

  async function guardar() {
    if (!form.servicio_id) return toast.error('Elegí un servicio.')
    if (!form.nombre.trim()) return toast.error('Poné un nombre.')
    setSaving(true)
    const payload = {
      servicio_id: form.servicio_id,
      nombre: form.nombre.trim(),
      descripcion: form.descripcion || null,
      precio: form.precio,
      moneda: form.moneda,
      caracteristicas: form.caracteristicas,
    }
    if (editId) {
      const { data, error } = await supabase
        .from('bloques_ejemplo')
        .update(payload)
        .eq('id', editId)
        .select('*')
        .single()
      setSaving(false)
      if (error) return toast.error('Error: ' + error.message)
      setEjemplos((p) =>
        p.map((b) => (b.id === editId ? (data as BloqueEjemplo) : b))
      )
    } else {
      const { data, error } = await supabase
        .from('bloques_ejemplo')
        .insert({ ...payload, orden: ejemplos.length })
        .select('*')
        .single()
      setSaving(false)
      if (error) return toast.error('Error: ' + error.message)
      setEjemplos((p) => [...p, data as BloqueEjemplo])
    }
    setOpen(false)
    toast.success('Bloque de ejemplo guardado.')
  }

  async function eliminar(b: BloqueEjemplo) {
    if (!confirm(`¿Eliminar el bloque de ejemplo "${b.nombre}"?`)) return
    const { error } = await supabase
      .from('bloques_ejemplo')
      .delete()
      .eq('id', b.id)
    if (error) return toast.error('Error: ' + error.message)
    setEjemplos((p) => p.filter((x) => x.id !== b.id))
    toast.success('Eliminado.')
  }

  if (servicios.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-2 py-16 text-center">
        <Boxes className="h-10 w-10 text-muted-foreground/40" />
        <p className="font-medium">Primero creá rubros y servicios</p>
        <p className="text-sm text-muted-foreground">
          Los bloques de ejemplo se categorizan por servicio. Andá a la pestaña
          &quot;Rubros y servicios&quot;.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={abrirNuevo} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo bloque de ejemplo
        </Button>
      </div>

      {ejemplos.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-16 text-center">
          <Boxes className="h-10 w-10 text-muted-foreground/40" />
          <p className="font-medium">Todavía no hay bloques de ejemplo</p>
          <p className="text-sm text-muted-foreground">
            Cargá ejemplos para que las agencias los usen de referencia.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {ejemplos.map((b) => (
            <Card key={b.id} className="flex flex-col gap-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">
                    {servicioLabel(b.servicio_id)}
                  </p>
                  <p className="font-medium">{b.nombre}</p>
                  {b.descripcion ? (
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {b.descripcion}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => abrirEditar(b)}
                    title="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => eliminar(b)}
                    title="Eliminar"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold">
                  {formatMoney(Number(b.precio), b.moneda)}
                </span>
                {(b.caracteristicas ?? []).length > 0 ? (
                  <span className="text-xs text-muted-foreground">
                    {b.caracteristicas.length} características
                  </span>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editId ? 'Editar bloque de ejemplo' : 'Nuevo bloque de ejemplo'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Servicio</Label>
              <Select
                value={form.servicio_id}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, servicio_id: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Elegí un servicio" />
                </SelectTrigger>
                <SelectContent>
                  {servicios.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {rubroDe.get(s.id)} › {s.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="e-nombre">Nombre</Label>
              <Input
                id="e-nombre"
                value={form.nombre}
                onChange={(e) =>
                  setForm((f) => ({ ...f, nombre: e.target.value }))
                }
                placeholder="Desarrollo frontend"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="e-desc">Descripción</Label>
              <Textarea
                id="e-desc"
                value={form.descripcion}
                onChange={(e) =>
                  setForm((f) => ({ ...f, descripcion: e.target.value }))
                }
                rows={2}
              />
            </div>
            <div className="flex items-end gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="e-precio">Precio sugerido</Label>
                <Input
                  id="e-precio"
                  type="number"
                  min={0}
                  value={form.precio === 0 ? '' : form.precio}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      precio: parseFloat(e.target.value) || 0,
                    }))
                  }
                  placeholder="0"
                  className="w-40"
                />
              </div>
              <CurrencyToggle
                value={form.moneda}
                onChange={(m) => setForm((f) => ({ ...f, moneda: m }))}
              />
            </div>
            <div className="border-t pt-3">
              <CaracteristicasEditor
                value={form.caracteristicas}
                onChange={(caracteristicas) =>
                  setForm((f) => ({ ...f, caracteristicas }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={guardar} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editId ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
