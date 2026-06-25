'use client'

import { v4 as uuidv4 } from 'uuid'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ItemRow, type LocalItem } from '@/components/editor/ItemRow'
import { formatTotales } from '@/lib/formatters'
import type { Item, Moneda } from '@/lib/types'

export function PlantillaItemsEditor({
  items,
  moneda,
  onChange,
}: {
  items: LocalItem[]
  moneda: Moneda
  onChange: (next: LocalItem[]) => void
}) {
  function add() {
    onChange([
      ...items,
      {
        id: uuidv4(),
        nombre: '',
        descripcion: '',
        precio: 0,
        moneda,
        caracteristicas: [],
      },
    ])
  }
  function patch(id: string, p: Partial<LocalItem>) {
    onChange(items.map((it) => (it.id === id ? { ...it, ...p } : it)))
  }
  function remove(id: string) {
    onChange(items.filter((it) => it.id !== id))
  }
  function move(id: string, dir: -1 | 1) {
    const idx = items.findIndex((it) => it.id === id)
    const target = idx + dir
    if (idx < 0 || target < 0 || target >= items.length) return
    const next = [...items]
    ;[next[idx], next[target]] = [next[target], next[idx]]
    onChange(next)
  }

  const paraTotal: Item[] = items.map((i) => ({
    id: i.id,
    propuesta_id: '',
    nombre: i.nombre,
    descripcion: i.descripcion,
    precio: i.precio,
    moneda: i.moneda,
    orden: 0,
    aceptado: true,
    caracteristicas: i.caracteristicas,
  }))

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
          La plantilla todavía no tiene bloques.
        </p>
      ) : (
        items.map((item, index) => (
          <ItemRow
            key={item.id}
            item={item}
            index={index}
            total={items.length}
            onChange={(p) => patch(item.id, p)}
            onRemove={() => remove(item.id)}
            onMove={(dir) => move(item.id, dir)}
          />
        ))
      )}

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" onClick={add} className="gap-2">
          <Plus className="h-4 w-4" />
          Agregar bloque
        </Button>
        {items.length > 0 ? (
          <div className="text-right text-sm">
            <span className="text-muted-foreground">Total: </span>
            <span className="font-semibold">{formatTotales(paraTotal)}</span>
          </div>
        ) : null}
      </div>
    </div>
  )
}
