'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RubrosManager } from './RubrosManager'
import { EjemplosManager } from './EjemplosManager'
import type { Rubro, Servicio, BloqueEjemplo } from '@/lib/types'

export function AdminPanel({
  rubros,
  servicios,
  ejemplos,
}: {
  rubros: Rubro[]
  servicios: Servicio[]
  ejemplos: BloqueEjemplo[]
}) {
  return (
    <Tabs defaultValue="taxonomia">
      <TabsList>
        <TabsTrigger value="taxonomia">Rubros y servicios</TabsTrigger>
        <TabsTrigger value="ejemplos">Bloques de ejemplo</TabsTrigger>
      </TabsList>
      <TabsContent value="taxonomia" className="mt-4">
        <RubrosManager rubros={rubros} servicios={servicios} />
      </TabsContent>
      <TabsContent value="ejemplos" className="mt-4">
        <EjemplosManager
          rubros={rubros}
          servicios={servicios}
          ejemplos={ejemplos}
        />
      </TabsContent>
    </Tabs>
  )
}
