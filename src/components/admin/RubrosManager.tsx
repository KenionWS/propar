'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Loader2, Tag, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { slugify } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import type { Rubro, Servicio } from '@/lib/types'

export function RubrosManager({
  rubros: rubrosIniciales,
  servicios: serviciosIniciales,
}: {
  rubros: Rubro[]
  servicios: Servicio[]
}) {
  const supabase = createClient()
  const [rubros, setRubros] = useState<Rubro[]>(rubrosIniciales)
  const [servicios, setServicios] = useState<Servicio[]>(serviciosIniciales)
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [nombre, setNombre] = useState('')
  const [saving, setSaving] = useState(false)

  function abrirNuevo() {
    setEditId(null)
    setNombre('')
    setOpen(true)
  }
  function abrirEditar(r: Rubro) {
    setEditId(r.id)
    setNombre(r.nombre)
    setOpen(true)
  }

  async function guardarRubro() {
    if (!nombre.trim()) {
      toast.error('Poné un nombre.')
      return
    }
    setSaving(true)
    const payload = { nombre: nombre.trim(), slug: slugify(nombre) }
    if (editId) {
      const { data, error } = await supabase
        .from('rubros')
        .update(payload)
        .eq('id', editId)
        .select('*')
        .single()
      setSaving(false)
      if (error) return toast.error('Error: ' + error.message)
      setRubros((p) => p.map((r) => (r.id === editId ? (data as Rubro) : r)))
    } else {
      const { data, error } = await supabase
        .from('rubros')
        .insert({ ...payload, orden: rubros.length })
        .select('*')
        .single()
      setSaving(false)
      if (error) return toast.error('Error: ' + error.message)
      setRubros((p) => [...p, data as Rubro])
    }
    setOpen(false)
    toast.success('Rubro guardado.')
  }

  async function eliminarRubro(r: Rubro) {
    if (!confirm(`¿Eliminar el rubro "${r.nombre}" y sus servicios?`)) return
    const { error } = await supabase.from('rubros').delete().eq('id', r.id)
    if (error) return toast.error('Error: ' + error.message)
    setRubros((p) => p.filter((x) => x.id !== r.id))
    setServicios((p) => p.filter((s) => s.rubro_id !== r.id))
    toast.success('Rubro eliminado.')
  }

  async function agregarServicio(rubroId: string, nombreServ: string) {
    const n = nombreServ.trim()
    if (!n) return
    const { data, error } = await supabase
      .from('servicios')
      .insert({
        rubro_id: rubroId,
        nombre: n,
        slug: slugify(n),
        orden: servicios.filter((s) => s.rubro_id === rubroId).length,
      })
      .select('*')
      .single()
    if (error) return toast.error('Error: ' + error.message)
    setServicios((p) => [...p, data as Servicio])
  }

  async function eliminarServicio(id: string) {
    const { error } = await supabase.from('servicios').delete().eq('id', id)
    if (error) return toast.error('Error: ' + error.message)
    setServicios((p) => p.filter((s) => s.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={abrirNuevo} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo rubro
        </Button>
      </div>

      {rubros.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-16 text-center">
          <Tag className="h-10 w-10 text-muted-foreground/40" />
          <p className="font-medium">Todavía no hay rubros</p>
          <p className="text-sm text-muted-foreground">
            Creá el primer rubro (ej. &quot;Desarrollo web&quot;).
          </p>
        </Card>
      ) : (
        rubros.map((r) => (
          <RubroCard
            key={r.id}
            rubro={r}
            servicios={servicios.filter((s) => s.rubro_id === r.id)}
            onEditar={() => abrirEditar(r)}
            onEliminar={() => eliminarRubro(r)}
            onAgregarServicio={(n) => agregarServicio(r.id, n)}
            onEliminarServicio={eliminarServicio}
          />
        ))
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? 'Editar rubro' : 'Nuevo rubro'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="rubro-nombre">Nombre</Label>
            <Input
              id="rubro-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Desarrollo web"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={guardarRubro} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editId ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function RubroCard({
  rubro,
  servicios,
  onEditar,
  onEliminar,
  onAgregarServicio,
  onEliminarServicio,
}: {
  rubro: Rubro
  servicios: Servicio[]
  onEditar: () => void
  onEliminar: () => void
  onAgregarServicio: (nombre: string) => void
  onEliminarServicio: (id: string) => void
}) {
  const [nuevoServ, setNuevoServ] = useState('')

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="font-semibold">{rubro.nombre}</p>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={onEditar} title="Editar">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onEliminar}
              title="Eliminar"
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {servicios.map((s) => (
            <Badge
              key={s.id}
              variant="secondary"
              className="gap-1.5 pr-1 font-normal"
            >
              {s.nombre}
              <button
                onClick={() => onEliminarServicio(s.id)}
                className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                title="Quitar servicio"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {servicios.length === 0 ? (
            <span className="text-xs text-muted-foreground">
              Sin servicios todavía
            </span>
          ) : null}
        </div>

        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            onAgregarServicio(nuevoServ)
            setNuevoServ('')
          }}
        >
          <Input
            value={nuevoServ}
            onChange={(e) => setNuevoServ(e.target.value)}
            placeholder="Agregar servicio (ej. E-commerce)"
            className="h-9"
          />
          <Button type="submit" variant="outline" size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Servicio
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
