'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'
import {
  ArrowLeft,
  Check,
  Loader2,
  Eye,
  Send,
  Copy,
  Download,
  Save,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { generarSlug } from '@/lib/utils'
import {
  fechaVencimientoDesde,
  formatTotalesIncluidos,
  formatMoney,
} from '@/lib/formatters'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StatusBadge } from '@/components/dashboard/StatusBadge'
import { ClienteSection } from './ClienteSection'
import { ItemsSection } from './ItemsSection'
import { CurrencyToggle } from './CurrencyToggle'
import type { LocalItem } from './ItemRow'
import type {
  Propuesta,
  Item,
  Moneda,
  Estado,
  BloqueInsertable,
  ModoAceptacion,
} from '@/lib/types'

type SaveState = 'idle' | 'saving' | 'saved'

interface FormState {
  titulo: string
  cliente_nombre: string
  cliente_empresa: string
  cliente_email: string
  cliente_telefono: string
  cliente_documento: string
  introduccion: string
  terminos: string
  moneda: Moneda
  tipo_cambio: string
  vigencia_dias: number
  modo_aceptacion: ModoAceptacion
}

export function ProposalEditor({
  propuesta,
  initialItems,
}: {
  propuesta: Propuesta
  initialItems: Item[]
}) {
  const router = useRouter()
  const supabase = createClient()
  const id = propuesta.id

  const [slug, setSlug] = useState(propuesta.slug)
  const [estado, setEstado] = useState<Estado>(propuesta.estado)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [sending, setSending] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const dirty = useRef(false)

  const [form, setForm] = useState<FormState>({
    titulo: propuesta.titulo ?? '',
    cliente_nombre: propuesta.cliente_nombre ?? '',
    cliente_empresa: propuesta.cliente_empresa ?? '',
    cliente_email: propuesta.cliente_email ?? '',
    cliente_telefono: propuesta.cliente_telefono ?? '',
    cliente_documento: propuesta.cliente_documento ?? '',
    introduccion: propuesta.introduccion ?? '',
    terminos: propuesta.terminos ?? '',
    moneda: propuesta.moneda,
    tipo_cambio: propuesta.tipo_cambio ? String(propuesta.tipo_cambio) : '',
    vigencia_dias: propuesta.vigencia_dias,
    modo_aceptacion: propuesta.modo_aceptacion ?? 'completa',
  })

  const [items, setItems] = useState<LocalItem[]>(
    [...initialItems]
      .sort((a, b) => a.orden - b.orden)
      .map((i) => ({
        id: i.id,
        nombre: i.nombre,
        descripcion: i.descripcion ?? '',
        precio: Number(i.precio),
        moneda: i.moneda,
        caracteristicas: i.caracteristicas ?? [],
      }))
  )

  const patchForm = (patch: Partial<FormState>) => {
    setForm((f) => ({ ...f, ...patch }))
    dirty.current = true
    setSaveState('idle')
  }

  const markDirty = () => {
    dirty.current = true
    setSaveState('idle')
  }

  // --- Items handlers ---
  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: uuidv4(),
        nombre: '',
        descripcion: '',
        precio: 0,
        moneda: form.moneda,
        caracteristicas: [],
      },
    ])
    markDirty()
  }
  const changeItem = (itemId: string, patch: Partial<LocalItem>) => {
    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, ...patch } : it))
    )
    markDirty()
  }
  const removeItem = (itemId: string) => {
    setItems((prev) => prev.filter((it) => it.id !== itemId))
    markDirty()
  }
  const moveItem = (itemId: string, dir: -1 | 1) => {
    setItems((prev) => {
      const idx = prev.findIndex((it) => it.id === itemId)
      const target = idx + dir
      if (idx < 0 || target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return next
    })
    markDirty()
  }
  const insertBloques = (bloques: BloqueInsertable[]) => {
    setItems((prev) => [
      ...prev,
      ...bloques.map((b) => ({
        id: uuidv4(),
        nombre: b.nombre,
        descripcion: b.descripcion ?? '',
        precio: Number(b.precio),
        moneda: b.moneda,
        caracteristicas: b.caracteristicas ?? [],
      })),
    ])
    markDirty()
    toast.success(
      bloques.length === 1
        ? 'Bloque agregado.'
        : `${bloques.length} bloques agregados.`
    )
  }
  const saveItemToLibrary = async (item: LocalItem) => {
    if (!item.nombre.trim()) {
      toast.error('El item necesita un nombre para guardarlo en la biblioteca.')
      return
    }
    const { error } = await supabase.from('bloques').insert({
      user_id: propuesta.user_id,
      nombre: item.nombre.trim(),
      descripcion: item.descripcion || null,
      precio: item.precio,
      moneda: item.moneda,
      caracteristicas: item.caracteristicas,
    })
    if (error) {
      toast.error('Error al guardar en biblioteca: ' + error.message)
      return
    }
    toast.success('Guardado en la biblioteca.')
  }

  // --- Persistencia ---
  const buildPropuestaPayload = useCallback(
    () => ({
      titulo: form.titulo,
      cliente_nombre: form.cliente_nombre,
      cliente_empresa: form.cliente_empresa || null,
      cliente_email: form.cliente_email || null,
      cliente_telefono: form.cliente_telefono || null,
      cliente_documento: form.cliente_documento || null,
      introduccion: form.introduccion || null,
      terminos: form.terminos || null,
      moneda: form.moneda,
      tipo_cambio:
        form.moneda === 'USD' && form.tipo_cambio
          ? Number(form.tipo_cambio)
          : null,
      vigencia_dias: form.vigencia_dias,
      modo_aceptacion: form.modo_aceptacion,
      updated_at: new Date().toISOString(),
    }),
    [form]
  )

  const cerrada =
    estado === 'aceptada' ||
    estado === 'aceptada_parcial' ||
    estado === 'rechazada'

  const save = useCallback(async (): Promise<boolean> => {
    setSaveState('saving')
    const { error: pErr } = await supabase
      .from('propuestas')
      .update(buildPropuestaPayload())
      .eq('id', id)

    if (pErr) {
      setSaveState('idle')
      toast.error('Error al guardar: ' + pErr.message)
      return false
    }

    // En propuestas ya respondidas no tocamos los items: preservamos qué
    // bloques aceptó el cliente (campo `aceptado`).
    if (cerrada) {
      dirty.current = false
      setSaveState('saved')
      return true
    }

    // Reemplazo total de items (los ids no se referencian externamente)
    const { error: dErr } = await supabase
      .from('items')
      .delete()
      .eq('propuesta_id', id)
    if (dErr) {
      setSaveState('idle')
      toast.error('Error al guardar items: ' + dErr.message)
      return false
    }

    if (items.length > 0) {
      const { error: iErr } = await supabase.from('items').insert(
        items.map((it, idx) => ({
          propuesta_id: id,
          nombre: it.nombre,
          descripcion: it.descripcion || null,
          precio: it.precio,
          moneda: it.moneda,
          orden: idx,
          aceptado: true,
          caracteristicas: it.caracteristicas,
        }))
      )
      if (iErr) {
        setSaveState('idle')
        toast.error('Error al guardar items: ' + iErr.message)
        return false
      }
    }

    dirty.current = false
    setSaveState('saved')
    return true
  }, [supabase, id, buildPropuestaPayload, items, cerrada])

  // Autoguardado cada 30s si hay cambios (no en propuestas ya respondidas)
  useEffect(() => {
    if (cerrada) return
    const interval = setInterval(() => {
      if (dirty.current && saveState !== 'saving') {
        save()
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [save, saveState, cerrada])

  // Guardar al salir de la página si hay cambios pendientes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty.current) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  function copiarLink(targetSlug = slug) {
    const url = `${window.location.origin}/p/${targetSlug}`
    navigator.clipboard.writeText(url)
    toast.success('Link copiado al portapapeles')
  }

  async function enviar() {
    if (!form.cliente_nombre.trim()) {
      toast.error('Ingresá el nombre del cliente antes de enviar.')
      return
    }
    if (!form.titulo.trim()) {
      toast.error('Ingresá un título para la propuesta antes de enviar.')
      return
    }
    if (items.length === 0) {
      toast.error('Agregá al menos un item antes de enviar.')
      return
    }

    setSending(true)
    const ok = await save()
    if (!ok) {
      setSending(false)
      return
    }

    // Generar slug definitivo si todavía es un borrador
    let finalSlug = slug
    if (slug.startsWith('borrador-')) {
      finalSlug = generarSlug(form.cliente_nombre)
    }

    const { error } = await supabase
      .from('propuestas')
      .update({
        estado: 'enviada',
        enviada_at: propuesta.enviada_at ?? new Date().toISOString(),
        slug: finalSlug,
      })
      .eq('id', id)

    setSending(false)

    if (error) {
      toast.error('Error al enviar: ' + error.message)
      return
    }

    setSlug(finalSlug)
    setEstado('enviada')
    copiarLink(finalSlug)
    toast.success('Propuesta enviada. Link copiado al portapapeles.')
    router.refresh()
  }

  async function confirmarAceptacion() {
    setConfirmando(true)
    const { error } = await supabase
      .from('propuestas')
      .update({ estado: 'aceptada', aceptada_at: new Date().toISOString() })
      .eq('id', id)
    setConfirmando(false)
    if (error) {
      toast.error('Error al confirmar: ' + error.message)
      return
    }
    setEstado('aceptada')
    toast.success('Aceptación confirmada. Los bloques no elegidos quedan fuera.')
    router.refresh()
  }

  const fechaVto = fechaVencimientoDesde(propuesta.enviada_at, form.vigencia_dias)
  const yaEnviada = estado !== 'borrador'
  const itemsAceptados = initialItems.filter((i) => i.aceptado !== false)
  const montoAceptado = formatTotalesIncluidos(initialItems)

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between border-b bg-background/80 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/propuestas">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">
                {form.titulo || 'Propuesta sin título'}
              </h1>
              <StatusBadge estado={estado} />
            </div>
            <SaveIndicator state={saveState} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={async () => {
              const ok = await save()
              if (ok) toast.success('Cambios guardados')
            }}
            disabled={saveState === 'saving'}
          >
            {saveState === 'saving' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Guardar</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={async () => {
              if (dirty.current) await save()
              window.open(`/propuestas/${id}/preview`, '_blank')
            }}
          >
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Previsualizar</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={async () => {
              if (dirty.current) await save()
              window.open(`/api/pdf/${id}`, '_blank')
            }}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">PDF</span>
          </Button>
          {yaEnviada ? (
            <Button
              size="sm"
              className="gap-2"
              onClick={() => copiarLink()}
            >
              <Copy className="h-4 w-4" />
              Copiar link
            </Button>
          ) : (
            <Button
              size="sm"
              className="gap-2"
              onClick={enviar}
              disabled={sending}
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Enviar propuesta
            </Button>
          )}
        </div>
      </div>

      {/* Aceptación parcial: el cliente eligió bloques, falta confirmar */}
      {estado === 'aceptada_parcial' ? (
        <Card className="border-teal-300 bg-teal-50">
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-teal-900">
                El cliente aceptó {itemsAceptados.length} de {initialItems.length}{' '}
                bloques por {montoAceptado}
              </p>
              <p className="text-sm text-teal-800">
                Confirmá para cerrar el trato. Los bloques no elegidos quedan
                fuera (ocultos en la propuesta y el PDF).
              </p>
            </div>
            <Button
              onClick={confirmarAceptacion}
              disabled={confirmando}
              className="gap-2 bg-teal-600 hover:bg-teal-700"
            >
              {confirmando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Confirmar aceptación
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Rechazada: mostrar el motivo si lo dejó */}
      {estado === 'rechazada' && propuesta.motivo_rechazo ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-red-900">
              Motivo del rechazo
            </p>
            <p className="mt-1 whitespace-pre-line text-sm text-red-800">
              {propuesta.motivo_rechazo}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {/* A — Datos del cliente */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <ClienteSection
            data={{
              cliente_nombre: form.cliente_nombre,
              cliente_empresa: form.cliente_empresa,
              cliente_email: form.cliente_email,
              cliente_telefono: form.cliente_telefono,
              cliente_documento: form.cliente_documento,
            }}
            onChange={patchForm}
          />
        </CardContent>
      </Card>

      {/* B — Contenido */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contenido de la propuesta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="titulo">
              Título de la propuesta <span className="text-destructive">*</span>
            </Label>
            <Input
              id="titulo"
              value={form.titulo}
              onChange={(e) => patchForm({ titulo: e.target.value })}
              placeholder="Desarrollo e-commerce PrestaShop"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="introduccion">Introducción</Label>
            <Textarea
              id="introduccion"
              value={form.introduccion}
              onChange={(e) => patchForm({ introduccion: e.target.value })}
              placeholder="Texto libre de presentación..."
              rows={4}
            />
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <div className="space-y-1.5">
              <Label>Moneda principal</Label>
              <div>
                <CurrencyToggle
                  value={form.moneda}
                  onChange={(m) => patchForm({ moneda: m })}
                />
              </div>
            </div>
            {form.moneda === 'USD' ? (
              <div className="space-y-1.5">
                <Label htmlFor="tipo_cambio">Tipo de cambio referencia</Label>
                <Input
                  id="tipo_cambio"
                  type="number"
                  value={form.tipo_cambio}
                  onChange={(e) => patchForm({ tipo_cambio: e.target.value })}
                  placeholder="1200"
                  className="w-40"
                />
                <p className="text-xs text-muted-foreground">
                  Solo informativo para el cliente. No afecta el precio pactado.
                </p>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* C — Items y precios */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {cerrada ? 'Respuesta del cliente' : 'Items y precios'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cerrada ? (
            <div className="space-y-3">
              {initialItems.map((it) => {
                const incluido = it.aceptado !== false
                return (
                  <div
                    key={it.id}
                    className="flex items-start justify-between gap-4 rounded-lg border p-3"
                  >
                    <div className="min-w-0">
                      <p
                        className={
                          incluido
                            ? 'font-medium'
                            : 'font-medium text-muted-foreground line-through'
                        }
                      >
                        {it.nombre || 'Sin nombre'}
                      </p>
                      {it.descripcion ? (
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {it.descripcion}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span
                        className={
                          incluido
                            ? 'font-medium'
                            : 'font-medium text-muted-foreground line-through'
                        }
                      >
                        {formatMoney(Number(it.precio), it.moneda)}
                      </span>
                      <Badge
                        variant="secondary"
                        className={
                          incluido
                            ? 'bg-green-100 text-green-700 hover:bg-green-100'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-100'
                        }
                      >
                        {incluido ? 'Aceptado' : 'No incluido'}
                      </Badge>
                    </div>
                  </div>
                )
              })}
              <div className="flex items-center justify-between border-t pt-3">
                <span className="text-sm text-muted-foreground">
                  Total aceptado
                </span>
                <span className="text-lg font-semibold">{montoAceptado}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Esta propuesta ya fue respondida por el cliente. Los items no se
                pueden editar para no perder su selección.
              </p>
            </div>
          ) : (
            <ItemsSection
              items={items}
              onAdd={addItem}
              onChange={changeItem}
              onRemove={removeItem}
              onMove={moveItem}
              onInsertBloques={insertBloques}
              onSaveToLibrary={saveItemToLibrary}
            />
          )}
        </CardContent>
      </Card>

      {/* D — Condiciones */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Condiciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Vigencia del precio</Label>
            <div className="flex flex-wrap items-center gap-3">
              <Select
                value={String(form.vigencia_dias)}
                onValueChange={(v) => patchForm({ vigencia_dias: Number(v) })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 días</SelectItem>
                  <SelectItem value="15">15 días</SelectItem>
                  <SelectItem value="30">30 días</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">
                Válido hasta el <strong>{fechaVto}</strong>
              </span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Modo de aceptación</Label>
            <div className="flex flex-wrap items-center gap-3">
              <Select
                value={form.modo_aceptacion}
                onValueChange={(v) =>
                  patchForm({ modo_aceptacion: v as ModoAceptacion })
                }
              >
                <SelectTrigger className="w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completa">
                    Completa (todo o nada)
                  </SelectItem>
                  <SelectItem value="por_bloques">
                    Por bloques (elige qué acepta)
                  </SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">
                {form.modo_aceptacion === 'por_bloques'
                  ? 'El cliente tilda qué bloques quiere; vos confirmás después.'
                  : 'El cliente acepta la propuesta completa.'}
              </span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="terminos">Términos y condiciones</Label>
            <Textarea
              id="terminos"
              value={form.terminos}
              onChange={(e) => patchForm({ terminos: e.target.value })}
              placeholder="Forma de pago, plazos, condiciones..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === 'saving') {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" /> Guardando...
      </span>
    )
  }
  if (state === 'saved') {
    return (
      <span className="flex items-center gap-1 text-xs text-green-600">
        <Check className="h-3 w-3" /> Guardado
      </span>
    )
  }
  return (
    <span className="text-xs text-muted-foreground">Cambios sin guardar</span>
  )
}
