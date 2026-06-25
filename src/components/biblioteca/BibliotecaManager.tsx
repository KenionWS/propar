'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Loader2, Library, Search } from 'lucide-react'
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
import { CurrencyToggle } from '@/components/editor/CurrencyToggle'
import { CaracteristicasEditor } from '@/components/editor/CaracteristicasEditor'
import { formatMoney } from '@/lib/formatters'
import type { Bloque, Moneda, Caracteristica } from '@/lib/types'

interface FormState {
  nombre: string
  descripcion: string
  precio: number
  moneda: Moneda
  caracteristicas: Caracteristica[]
}

const EMPTY: FormState = {
  nombre: '',
  descripcion: '',
  precio: 0,
  moneda: 'ARS',
  caracteristicas: [],
}

export function BibliotecaManager({
  userId,
  initial,
}: {
  userId: string
  initial: Bloque[]
}) {
  const supabase = createClient()
  const [bloques, setBloques] = useState<Bloque[]>(initial)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)

  const filtrados = bloques.filter((b) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return (
      b.nombre.toLowerCase().includes(q) ||
      (b.descripcion ?? '').toLowerCase().includes(q)
    )
  })

  function abrirNuevo() {
    setEditId(null)
    setForm(EMPTY)
    setOpen(true)
  }

  function abrirEditar(b: Bloque) {
    setEditId(b.id)
    setForm({
      nombre: b.nombre,
      descripcion: b.descripcion ?? '',
      precio: Number(b.precio),
      moneda: b.moneda,
      caracteristicas: b.caracteristicas ?? [],
    })
    setOpen(true)
  }

  async function guardar() {
    if (!form.nombre.trim()) {
      toast.error('Poné un nombre al bloque.')
      return
    }
    setSaving(true)
    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion || null,
      precio: form.precio,
      moneda: form.moneda,
      caracteristicas: form.caracteristicas,
      updated_at: new Date().toISOString(),
    }

    if (editId) {
      const { data, error } = await supabase
        .from('bloques')
        .update(payload)
        .eq('id', editId)
        .select('*')
        .single()
      setSaving(false)
      if (error) {
        toast.error('Error: ' + error.message)
        return
      }
      setBloques((prev) =>
        prev.map((b) => (b.id === editId ? (data as Bloque) : b))
      )
      toast.success('Bloque actualizado.')
    } else {
      const { data, error } = await supabase
        .from('bloques')
        .insert({ ...payload, user_id: userId })
        .select('*')
        .single()
      setSaving(false)
      if (error) {
        toast.error('Error: ' + error.message)
        return
      }
      setBloques((prev) => [data as Bloque, ...prev])
      toast.success('Bloque creado.')
    }
    setOpen(false)
  }

  async function eliminar(b: Bloque) {
    if (!confirm(`¿Eliminar el bloque "${b.nombre}" de la biblioteca?`)) return
    const { error } = await supabase.from('bloques').delete().eq('id', b.id)
    if (error) {
      toast.error('Error: ' + error.message)
      return
    }
    setBloques((prev) => prev.filter((x) => x.id !== b.id))
    toast.success('Bloque eliminado.')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar bloque..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={abrirNuevo} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo bloque
        </Button>
      </div>

      {filtrados.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 py-16 text-center">
          <Library className="h-10 w-10 text-muted-foreground/40" />
          <div>
            <p className="font-medium">
              {bloques.length === 0
                ? 'Tu biblioteca está vacía'
                : 'No hay bloques que coincidan'}
            </p>
            <p className="text-sm text-muted-foreground">
              Guardá servicios que repetís para reutilizarlos en tus propuestas.
            </p>
          </div>
          {bloques.length === 0 ? (
            <Button onClick={abrirNuevo} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Crear el primero
            </Button>
          ) : null}
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {filtrados.map((b) => (
            <Card key={b.id} className="flex flex-col gap-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
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
                {b.veces_usado > 0 ? (
                  <span className="text-xs text-muted-foreground">
                    Usado {b.veces_usado}×
                  </span>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editId ? 'Editar bloque' : 'Nuevo bloque'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="b-nombre">Nombre</Label>
              <Input
                id="b-nombre"
                value={form.nombre}
                onChange={(e) =>
                  setForm((f) => ({ ...f, nombre: e.target.value }))
                }
                placeholder="Desarrollo PrestaShop"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="b-desc">Descripción</Label>
              <Textarea
                id="b-desc"
                value={form.descripcion}
                onChange={(e) =>
                  setForm((f) => ({ ...f, descripcion: e.target.value }))
                }
                placeholder="Instalación, configuración y customización"
                rows={3}
              />
            </div>
            <div className="flex items-end gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="b-precio">Precio</Label>
                <Input
                  id="b-precio"
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
              {editId ? 'Guardar' : 'Crear bloque'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
