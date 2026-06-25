'use client'

import { useMemo, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Loader2, LayoutTemplate } from 'lucide-react'
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
import type { LocalItem } from '@/components/editor/ItemRow'
import { PlantillaItemsEditor } from './PlantillaItemsEditor'
import type {
  Rubro,
  Plantilla,
  PlantillaItem,
  Moneda,
  ModoAceptacion,
} from '@/lib/types'

interface FormState {
  rubro_id: string
  nombre: string
  descripcion: string
  introduccion: string
  terminos: string
  moneda: Moneda
  vigencia_dias: number
  modo_aceptacion: ModoAceptacion
  items: LocalItem[]
}

const EMPTY: FormState = {
  rubro_id: '',
  nombre: '',
  descripcion: '',
  introduccion: '',
  terminos: '',
  moneda: 'ARS',
  vigencia_dias: 15,
  modo_aceptacion: 'completa',
  items: [],
}

function aLocalItems(items: PlantillaItem[]): LocalItem[] {
  return (items ?? []).map((i) => ({
    id: uuidv4(),
    nombre: i.nombre,
    descripcion: i.descripcion ?? '',
    precio: Number(i.precio),
    moneda: i.moneda,
    caracteristicas: i.caracteristicas ?? [],
  }))
}

export function PlantillasManager({
  rubros,
  plantillas: plantillasIniciales,
}: {
  rubros: Rubro[]
  plantillas: Plantilla[]
}) {
  const supabase = createClient()
  const [plantillas, setPlantillas] = useState<Plantilla[]>(plantillasIniciales)
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)

  const rubroNombre = useMemo(() => {
    const m = new Map<string, string>()
    rubros.forEach((r) => m.set(r.id, r.nombre))
    return m
  }, [rubros])

  const patch = (p: Partial<FormState>) => setForm((f) => ({ ...f, ...p }))

  function abrirNuevo() {
    setEditId(null)
    setForm({ ...EMPTY, rubro_id: rubros[0]?.id ?? '' })
    setOpen(true)
  }
  function abrirEditar(p: Plantilla) {
    setEditId(p.id)
    setForm({
      rubro_id: p.rubro_id,
      nombre: p.nombre,
      descripcion: p.descripcion ?? '',
      introduccion: p.introduccion ?? '',
      terminos: p.terminos ?? '',
      moneda: p.moneda,
      vigencia_dias: p.vigencia_dias,
      modo_aceptacion: p.modo_aceptacion,
      items: aLocalItems(p.items),
    })
    setOpen(true)
  }

  async function guardar() {
    if (!form.rubro_id) return toast.error('Elegí un rubro.')
    if (!form.nombre.trim()) return toast.error('Poné un nombre.')
    setSaving(true)
    const itemsJson: PlantillaItem[] = form.items.map((i) => ({
      nombre: i.nombre,
      descripcion: i.descripcion || null,
      precio: i.precio,
      moneda: i.moneda,
      caracteristicas: i.caracteristicas,
    }))
    const payload = {
      rubro_id: form.rubro_id,
      nombre: form.nombre.trim(),
      descripcion: form.descripcion || null,
      introduccion: form.introduccion || null,
      terminos: form.terminos || null,
      moneda: form.moneda,
      vigencia_dias: form.vigencia_dias,
      modo_aceptacion: form.modo_aceptacion,
      items: itemsJson,
    }

    if (editId) {
      const { data, error } = await supabase
        .from('plantillas')
        .update(payload)
        .eq('id', editId)
        .select('*')
        .single()
      setSaving(false)
      if (error) return toast.error('Error: ' + error.message)
      setPlantillas((p) =>
        p.map((x) => (x.id === editId ? (data as Plantilla) : x))
      )
    } else {
      const { data, error } = await supabase
        .from('plantillas')
        .insert({ ...payload, orden: plantillas.length })
        .select('*')
        .single()
      setSaving(false)
      if (error) return toast.error('Error: ' + error.message)
      setPlantillas((p) => [...p, data as Plantilla])
    }
    setOpen(false)
    toast.success('Plantilla guardada.')
  }

  async function eliminar(p: Plantilla) {
    if (!confirm(`¿Eliminar la plantilla "${p.nombre}"?`)) return
    const { error } = await supabase.from('plantillas').delete().eq('id', p.id)
    if (error) return toast.error('Error: ' + error.message)
    setPlantillas((prev) => prev.filter((x) => x.id !== p.id))
    toast.success('Eliminada.')
  }

  if (rubros.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-2 py-16 text-center">
        <LayoutTemplate className="h-10 w-10 text-muted-foreground/40" />
        <p className="font-medium">Primero creá rubros</p>
        <p className="text-sm text-muted-foreground">
          Las plantillas se categorizan por rubro.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={abrirNuevo} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva plantilla
        </Button>
      </div>

      {plantillas.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-16 text-center">
          <LayoutTemplate className="h-10 w-10 text-muted-foreground/40" />
          <p className="font-medium">Todavía no hay plantillas</p>
          <p className="text-sm text-muted-foreground">
            Armá cotizaciones de ejemplo que las agencias clonen.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {plantillas.map((p) => (
            <Card key={p.id} className="flex flex-col gap-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">
                    {rubroNombre.get(p.rubro_id) ?? '—'}
                  </p>
                  <p className="font-medium">{p.nombre}</p>
                  {p.descripcion ? (
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {p.descripcion}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => abrirEditar(p)}
                    title="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => eliminar(p)}
                    title="Eliminar"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">
                {p.items?.length ?? 0} bloque
                {(p.items?.length ?? 0) === 1 ? '' : 's'}
              </span>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editId ? 'Editar plantilla' : 'Nueva plantilla'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Rubro</Label>
                <Select
                  value={form.rubro_id}
                  onValueChange={(v) => patch({ rubro_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Elegí un rubro" />
                  </SelectTrigger>
                  <SelectContent>
                    {rubros.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pl-nombre">Nombre de la plantilla</Label>
                <Input
                  id="pl-nombre"
                  value={form.nombre}
                  onChange={(e) => patch({ nombre: e.target.value })}
                  placeholder="Landing institucional"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pl-desc">Descripción corta</Label>
              <Input
                id="pl-desc"
                value={form.descripcion}
                onChange={(e) => patch({ descripcion: e.target.value })}
                placeholder="Para qué sirve esta plantilla"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pl-intro">Introducción (de la propuesta)</Label>
              <Textarea
                id="pl-intro"
                value={form.introduccion}
                onChange={(e) => patch({ introduccion: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-1.5">
                <Label>Moneda</Label>
                <div>
                  <CurrencyToggle
                    value={form.moneda}
                    onChange={(m) => patch({ moneda: m })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Vigencia</Label>
                <Select
                  value={String(form.vigencia_dias)}
                  onValueChange={(v) => patch({ vigencia_dias: Number(v) })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 días</SelectItem>
                    <SelectItem value="15">15 días</SelectItem>
                    <SelectItem value="30">30 días</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Aceptación</Label>
                <Select
                  value={form.modo_aceptacion}
                  onValueChange={(v) =>
                    patch({ modo_aceptacion: v as ModoAceptacion })
                  }
                >
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completa">Completa</SelectItem>
                    <SelectItem value="por_bloques">Por bloques</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Bloques</Label>
              <PlantillaItemsEditor
                items={form.items}
                moneda={form.moneda}
                onChange={(items) => patch({ items })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pl-terminos">Términos y condiciones</Label>
              <Textarea
                id="pl-terminos"
                value={form.terminos}
                onChange={(e) => patch({ terminos: e.target.value })}
                rows={3}
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
