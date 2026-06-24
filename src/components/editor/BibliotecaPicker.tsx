'use client'

import { useEffect, useState } from 'react'
import { Library, Search, Loader2, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { formatMoney } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import type { Bloque } from '@/lib/types'

export function BibliotecaPicker({
  onInsert,
}: {
  onInsert: (bloques: Bloque[]) => void
}) {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [bloques, setBloques] = useState<Bloque[]>([])
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setSeleccion(new Set())
    supabase
      .from('bloques')
      .select('*')
      .order('veces_usado', { ascending: false })
      .order('updated_at', { ascending: false })
      .then(({ data }) => {
        setBloques((data ?? []) as Bloque[])
        setLoading(false)
      })
  }, [open, supabase])

  const filtrados = bloques.filter((b) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return (
      b.nombre.toLowerCase().includes(q) ||
      (b.descripcion ?? '').toLowerCase().includes(q)
    )
  })

  function toggle(id: string) {
    setSeleccion((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function insertar() {
    const elegidos = bloques.filter((b) => seleccion.has(b.id))
    if (elegidos.length === 0) return
    onInsert(elegidos)

    // Incrementar contador de uso (no bloqueante)
    for (const b of elegidos) {
      supabase
        .from('bloques')
        .update({ veces_usado: b.veces_usado + 1 })
        .eq('id', b.id)
        .then(() => {})
    }
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="gap-2">
          <Library className="h-4 w-4" />
          Desde biblioteca
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Insertar desde la biblioteca</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar bloque..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="max-h-72 space-y-2 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : filtrados.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Library className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {bloques.length === 0
                  ? 'No tenés bloques guardados todavía.'
                  : 'Ningún bloque coincide.'}
              </p>
            </div>
          ) : (
            filtrados.map((b) => {
              const sel = seleccion.has(b.id)
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => toggle(b.id)}
                  className={cn(
                    'flex w-full items-start justify-between gap-3 rounded-lg border p-3 text-left transition-colors',
                    sel
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  )}
                >
                  <div className="min-w-0">
                    <p className="font-medium">{b.nombre}</p>
                    {b.descripcion ? (
                      <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                        {b.descripcion}
                      </p>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-sm font-semibold">
                    {formatMoney(Number(b.precio), b.moneda)}
                  </span>
                </button>
              )
            })
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={insertar}
            disabled={seleccion.size === 0}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Agregar{seleccion.size > 0 ? ` (${seleccion.size})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
