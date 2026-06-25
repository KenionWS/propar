'use client'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { CurrencyToggle } from './CurrencyToggle'
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  GripVertical,
  BookmarkPlus,
} from 'lucide-react'
import type { Moneda, Caracteristica } from '@/lib/types'
import { CaracteristicasEditor } from './CaracteristicasEditor'

export interface LocalItem {
  id: string
  nombre: string
  descripcion: string
  precio: number
  moneda: Moneda
  caracteristicas: Caracteristica[]
}

export function ItemRow({
  item,
  index,
  total,
  onChange,
  onRemove,
  onMove,
  onSaveToLibrary,
}: {
  item: LocalItem
  index: number
  total: number
  onChange: (patch: Partial<LocalItem>) => void
  onRemove: () => void
  onMove: (dir: -1 | 1) => void
  onSaveToLibrary: () => void
}) {
  return (
    <div className="flex gap-3 rounded-lg border bg-card p-3">
      <div className="flex flex-col items-center justify-center gap-0.5 text-muted-foreground">
        <GripVertical className="mb-1 h-4 w-4 opacity-40" />
        <button
          type="button"
          onClick={() => onMove(-1)}
          disabled={index === 0}
          className="rounded p-0.5 hover:bg-muted disabled:opacity-30"
          title="Subir"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onMove(1)}
          disabled={index === total - 1}
          className="rounded p-0.5 hover:bg-muted disabled:opacity-30"
          title="Bajar"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-2">
        <Input
          placeholder="Nombre del item (ej: Desarrollo PrestaShop)"
          value={item.nombre}
          onChange={(e) => onChange({ nombre: e.target.value })}
          className="font-medium"
        />
        <Textarea
          placeholder="Descripción (opcional)"
          value={item.descripcion}
          onChange={(e) => onChange({ descripcion: e.target.value })}
          className="min-h-[44px] resize-none text-sm"
          rows={2}
        />
        <div className="flex items-center gap-2">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              $
            </span>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              step="any"
              value={item.precio === 0 ? '' : item.precio}
              onChange={(e) =>
                onChange({ precio: parseFloat(e.target.value) || 0 })
              }
              placeholder="0"
              className="w-40 pl-7"
            />
          </div>
          <CurrencyToggle
            size="sm"
            value={item.moneda}
            onChange={(m) => onChange({ moneda: m })}
          />
        </div>

        <div className="border-t pt-2">
          <CaracteristicasEditor
            value={item.caracteristicas}
            onChange={(caracteristicas) => onChange({ caracteristicas })}
          />
        </div>
      </div>

      <div className="flex flex-col items-start gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onSaveToLibrary}
          title="Guardar en biblioteca"
          className="text-muted-foreground hover:text-primary"
        >
          <BookmarkPlus className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          title="Eliminar item"
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
