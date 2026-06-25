'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Loader2, LayoutTemplate, ArrowRight, ArrowLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatMoney } from '@/lib/formatters'
import type { Rubro, Plantilla, Moneda } from '@/lib/types'

function totalLabel(p: Plantilla): string {
  const tot: Record<Moneda, number> = { ARS: 0, USD: 0 }
  for (const it of p.items ?? []) tot[it.moneda] += Number(it.precio) || 0
  const partes: string[] = []
  if (tot.ARS > 0) partes.push(formatMoney(tot.ARS, 'ARS'))
  if (tot.USD > 0) partes.push(formatMoney(tot.USD, 'USD'))
  return partes.join(' + ') || formatMoney(0, p.moneda)
}

export function PlantillasGaleria({
  plantillas,
  rubros,
}: {
  plantillas: Plantilla[]
  rubros: Rubro[]
}) {
  const router = useRouter()
  const [clonando, setClonando] = useState<string | null>(null)

  async function usar(p: Plantilla) {
    setClonando(p.id)
    const res = await fetch(`/api/plantillas/${p.id}/clonar`, { method: 'POST' })
    const j = await res.json().catch(() => ({}))
    if (res.ok && j.id) {
      toast.success('Propuesta creada desde la plantilla.')
      router.push(`/propuestas/${j.id}`)
    } else {
      setClonando(null)
      toast.error(j.error ?? 'No se pudo crear la propuesta.')
    }
  }

  if (plantillas.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 py-16 text-center">
        <LayoutTemplate className="h-10 w-10 text-muted-foreground/40" />
        <div>
          <p className="font-medium">Todavía no hay plantillas disponibles</p>
          <p className="text-sm text-muted-foreground">
            Cuando haya plantillas en el catálogo, las vas a ver acá.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link href="/propuestas/nueva">
            <ArrowLeft className="h-4 w-4" />
            Crear una propuesta en blanco
          </Link>
        </Button>
      </Card>
    )
  }

  const rubrosConPlantillas = rubros.filter((r) =>
    plantillas.some((p) => p.rubro_id === r.id)
  )

  return (
    <div className="space-y-8">
      {rubrosConPlantillas.map((r) => {
        const delRubro = plantillas.filter((p) => p.rubro_id === r.id)
        return (
          <div key={r.id}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {r.nombre}
            </h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {delRubro.map((p) => (
                <Card key={p.id} className="flex flex-col">
                  <CardContent className="flex flex-1 flex-col gap-3 p-5">
                    <div className="flex-1">
                      <p className="font-semibold">{p.nombre}</p>
                      {p.descripcion ? (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {p.descripcion}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {p.items?.length ?? 0} bloque
                        {(p.items?.length ?? 0) === 1 ? '' : 's'}
                      </span>
                      <span className="font-semibold">{totalLabel(p)}</span>
                    </div>
                    <Button
                      className="w-full gap-2"
                      onClick={() => usar(p)}
                      disabled={clonando !== null}
                    >
                      {clonando === p.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowRight className="h-4 w-4" />
                      )}
                      Usar esta plantilla
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
