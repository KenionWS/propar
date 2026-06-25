'use client'

import { useEffect, useState } from 'react'
import { Library, Search, Loader2, Plus, Boxes } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import type {
  Bloque,
  BloqueEjemplo,
  BloqueInsertable,
  Rubro,
  Servicio,
} from '@/lib/types'

type Fuente = 'biblioteca' | 'ejemplos'

interface Fila {
  id: string
  nombre: string
  descripcion: string | null
  precio: number
  moneda: 'ARS' | 'USD'
  caracteristicas: BloqueInsertable['caracteristicas']
  etiqueta?: string
}

export function BibliotecaPicker({
  onInsert,
}: {
  onInsert: (bloques: BloqueInsertable[]) => void
}) {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [fuente, setFuente] = useState<Fuente>('biblioteca')
  const [loadingBib, setLoadingBib] = useState(false)
  const [loadingEj, setLoadingEj] = useState(false)
  const [bloques, setBloques] = useState<Bloque[]>([])
  const [ejemplos, setEjemplos] = useState<Fila[]>([])
  const [ejemplosCargados, setEjemplosCargados] = useState(false)
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')

  // Biblioteca propia: al abrir
  useEffect(() => {
    if (!open) return
    setLoadingBib(true)
    setSeleccion(new Set())
    setQuery('')
    supabase
      .from('bloques')
      .select('*')
      .order('veces_usado', { ascending: false })
      .order('updated_at', { ascending: false })
      .then(({ data }) => {
        setBloques((data ?? []) as Bloque[])
        setLoadingBib(false)
      })
  }, [open, supabase])

  // Ejemplos de la plataforma: la primera vez que se entra a la pestaña
  useEffect(() => {
    if (!open || fuente !== 'ejemplos' || ejemplosCargados) return
    setLoadingEj(true)
    Promise.all([
      supabase.from('bloques_ejemplo').select('*').order('orden'),
      supabase.from('servicios').select('*'),
      supabase.from('rubros').select('*'),
    ]).then(([ej, serv, rub]) => {
      const servicios = (serv.data ?? []) as Servicio[]
      const rubros = (rub.data ?? []) as Rubro[]
      const filas: Fila[] = ((ej.data ?? []) as BloqueEjemplo[]).map((b) => {
        const s = servicios.find((x) => x.id === b.servicio_id)
        const r = s ? rubros.find((x) => x.id === s.rubro_id) : undefined
        return {
          id: b.id,
          nombre: b.nombre,
          descripcion: b.descripcion,
          precio: Number(b.precio),
          moneda: b.moneda,
          caracteristicas: b.caracteristicas ?? [],
          etiqueta: s ? `${r?.nombre ?? ''} › ${s.nombre}` : undefined,
        }
      })
      setEjemplos(filas)
      setEjemplosCargados(true)
      setLoadingEj(false)
    })
  }, [open, fuente, ejemplosCargados, supabase])

  function cambiarFuente(f: Fuente) {
    setFuente(f)
    setSeleccion(new Set())
    setQuery('')
  }

  const filasBiblioteca: Fila[] = bloques.map((b) => ({
    id: b.id,
    nombre: b.nombre,
    descripcion: b.descripcion,
    precio: Number(b.precio),
    moneda: b.moneda,
    caracteristicas: b.caracteristicas ?? [],
  }))

  const filas = fuente === 'biblioteca' ? filasBiblioteca : ejemplos
  const loading = fuente === 'biblioteca' ? loadingBib : loadingEj

  const filtradas = filas.filter((f) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return (
      f.nombre.toLowerCase().includes(q) ||
      (f.descripcion ?? '').toLowerCase().includes(q) ||
      (f.etiqueta ?? '').toLowerCase().includes(q)
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

  function insertar() {
    const elegidos = filas.filter((f) => seleccion.has(f.id))
    if (elegidos.length === 0) return
    onInsert(
      elegidos.map((f) => ({
        nombre: f.nombre,
        descripcion: f.descripcion,
        precio: f.precio,
        moneda: f.moneda,
        caracteristicas: f.caracteristicas,
      }))
    )
    // Incrementar uso solo para bloques de la biblioteca propia
    if (fuente === 'biblioteca') {
      for (const b of bloques.filter((x) => seleccion.has(x.id))) {
        supabase
          .from('bloques')
          .update({ veces_usado: b.veces_usado + 1 })
          .eq('id', b.id)
          .then(() => {})
      }
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
          <DialogTitle>Insertar bloques</DialogTitle>
        </DialogHeader>

        <Tabs value={fuente} onValueChange={(v) => cambiarFuente(v as Fuente)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="biblioteca" className="gap-1.5">
              <Library className="h-3.5 w-3.5" />
              Mi biblioteca
            </TabsTrigger>
            <TabsTrigger value="ejemplos" className="gap-1.5">
              <Boxes className="h-3.5 w-3.5" />
              Ejemplos
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
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
          ) : filtradas.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Boxes className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {fuente === 'biblioteca'
                  ? 'No tenés bloques guardados todavía.'
                  : 'Todavía no hay ejemplos cargados.'}
              </p>
            </div>
          ) : (
            filtradas.map((f) => {
              const sel = seleccion.has(f.id)
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => toggle(f.id)}
                  className={cn(
                    'flex w-full items-start justify-between gap-3 rounded-lg border p-3 text-left transition-colors',
                    sel ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                  )}
                >
                  <div className="min-w-0">
                    {f.etiqueta ? (
                      <p className="text-[11px] text-muted-foreground">
                        {f.etiqueta}
                      </p>
                    ) : null}
                    <p className="font-medium">{f.nombre}</p>
                    {f.descripcion ? (
                      <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                        {f.descripcion}
                      </p>
                    ) : null}
                    {f.caracteristicas.length > 0 ? (
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {f.caracteristicas.length} características
                      </p>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-sm font-semibold">
                    {formatMoney(Number(f.precio), f.moneda)}
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
