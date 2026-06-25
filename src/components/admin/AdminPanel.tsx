'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RubrosManager } from './RubrosManager'
import { EjemplosManager } from './EjemplosManager'
import { PlantillasManager } from './PlantillasManager'
import type { Rubro, Servicio, BloqueEjemplo, Plantilla } from '@/lib/types'

export function AdminPanel({
  rubros,
  servicios,
  ejemplos,
  plantillas,
}: {
  rubros: Rubro[]
  servicios: Servicio[]
  ejemplos: BloqueEjemplo[]
  plantillas: Plantilla[]
}) {
  return (
    <Tabs defaultValue="taxonomia">
      <TabsList>
        <TabsTrigger value="taxonomia">Rubros y servicios</TabsTrigger>
        <TabsTrigger value="ejemplos">Bloques de ejemplo</TabsTrigger>
        <TabsTrigger value="plantillas">Plantillas</TabsTrigger>
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
      <TabsContent value="plantillas" className="mt-4">
        <PlantillasManager rubros={rubros} plantillas={plantillas} />
      </TabsContent>
    </Tabs>
  )
}
