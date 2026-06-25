'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ICONOS, ICONOS_LISTA, getIcono } from '@/lib/iconos'
import { cn } from '@/lib/utils'
import type { Caracteristica } from '@/lib/types'

export function CaracteristicasEditor({
  value,
  onChange,
}: {
  value: Caracteristica[]
  onChange: (next: Caracteristica[]) => void
}) {
  function patch(i: number, p: Partial<Caracteristica>) {
    onChange(value.map((c, idx) => (idx === i ? { ...c, ...p } : c)))
  }
  function add() {
    onChange([...value, { icono: 'check', titulo: '', descripcion: '' }])
  }
  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i))
  }

  return (
    <div className="space-y-2">
      {value.length > 0 ? (
        <p className="text-xs font-medium text-muted-foreground">
          Características incluidas
        </p>
      ) : null}

      {value.map((c, i) => {
        const Icon = getIcono(c.icono)
        return (
          <div key={i} className="flex items-start gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="mt-0 shrink-0"
                  title="Elegir ícono"
                >
                  <Icon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-auto p-2">
                <div className="grid grid-cols-8 gap-1">
                  {ICONOS_LISTA.map((name) => {
                    const I = ICONOS[name]
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => patch(i, { icono: name })}
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded hover:bg-accent',
                          c.icono === name && 'bg-accent ring-1 ring-primary'
                        )}
                        title={name}
                      >
                        <I className="h-4 w-4" />
                      </button>
                    )
                  })}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex-1 space-y-1">
              <Input
                value={c.titulo}
                onChange={(e) => patch(i, { titulo: e.target.value })}
                placeholder="Título (ej. Responsive completo)"
                className="h-9"
              />
              <Input
                value={c.descripcion}
                onChange={(e) => patch(i, { descripcion: e.target.value })}
                placeholder="Detalle (opcional)"
                className="h-8 text-xs"
              />
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(i)}
              className="shrink-0 text-muted-foreground hover:text-destructive"
              title="Quitar"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      })}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={add}
        className="gap-1.5 text-muted-foreground"
      >
        <Plus className="h-3.5 w-3.5" />
        Agregar característica
      </Button>
    </div>
  )
}
