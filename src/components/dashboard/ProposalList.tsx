'use client'

import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { ProposalRow } from './ProposalRow'
import { Search, FileText } from 'lucide-react'
import type { Propuesta, Item } from '@/lib/types'

type Filtro = 'todas' | 'activas' | 'cerradas'

const ACTIVAS = new Set(['borrador', 'enviada', 'vista', 'aceptada_parcial'])
const CERRADAS = new Set(['aceptada', 'rechazada'])

export function ProposalList({
  propuestas,
}: {
  propuestas: (Propuesta & { items: Item[] })[]
}) {
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [query, setQuery] = useState('')

  const filtradas = useMemo(() => {
    const q = query.trim().toLowerCase()
    return propuestas.filter((p) => {
      if (filtro === 'activas' && !ACTIVAS.has(p.estado)) return false
      if (filtro === 'cerradas' && !CERRADAS.has(p.estado)) return false
      if (!q) return true
      return (
        p.cliente_nombre.toLowerCase().includes(q) ||
        (p.cliente_empresa ?? '').toLowerCase().includes(q) ||
        p.titulo.toLowerCase().includes(q)
      )
    })
  }, [propuestas, filtro, query])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={filtro} onValueChange={(v) => setFiltro(v as Filtro)}>
          <TabsList>
            <TabsTrigger value="todas">Todas</TabsTrigger>
            <TabsTrigger value="activas">Activas</TabsTrigger>
            <TabsTrigger value="cerradas">Cerradas</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente o título..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Card className="divide-y overflow-hidden">
        {filtradas.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No hay propuestas que coincidan.
            </p>
          </div>
        ) : (
          filtradas.map((p) => <ProposalRow key={p.id} propuesta={p} />)
        )}
      </Card>
    </div>
  )
}
