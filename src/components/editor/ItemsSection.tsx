'use client'

import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { ItemRow, type LocalItem } from './ItemRow'
import { BibliotecaPicker } from './BibliotecaPicker'
import { formatTotales } from '@/lib/formatters'
import type { Item, Bloque } from '@/lib/types'

export function ItemsSection({
  items,
  onAdd,
  onChange,
  onRemove,
  onMove,
  onInsertBloques,
  onSaveToLibrary,
}: {
  items: LocalItem[]
  onAdd: () => void
  onChange: (id: string, patch: Partial<LocalItem>) => void
  onRemove: (id: string) => void
  onMove: (id: string, dir: -1 | 1) => void
  onInsertBloques: (bloques: Bloque[]) => void
  onSaveToLibrary: (item: LocalItem) => void
}) {
  const itemsParaTotal: Item[] = items.map((i) => ({
    id: i.id,
    propuesta_id: '',
    nombre: i.nombre,
    descripcion: i.descripcion,
    precio: i.precio,
    moneda: i.moneda,
    orden: 0,
    aceptado: true,
  }))

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
          Todavía no agregaste items. Sumá el primero.
        </p>
      ) : (
        items.map((item, index) => (
          <ItemRow
            key={item.id}
            item={item}
            index={index}
            total={items.length}
            onChange={(patch) => onChange(item.id, patch)}
            onRemove={() => onRemove(item.id)}
            onMove={(dir) => onMove(item.id, dir)}
            onSaveToLibrary={() => onSaveToLibrary(item)}
          />
        ))
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={onAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Agregar item
          </Button>
          <BibliotecaPicker onInsert={onInsertBloques} />
        </div>

        {items.length > 0 ? (
          <div className="text-right">
            <span className="text-sm text-muted-foreground">Total: </span>
            <span className="text-lg font-semibold">
              {formatTotales(itemsParaTotal)}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  )
}
