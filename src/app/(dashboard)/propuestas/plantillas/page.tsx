import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PlantillasGaleria } from '@/components/propuestas/PlantillasGaleria'
import type { Rubro, Plantilla } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function PlantillasGaleriaPage() {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const [{ data: plantillas }, { data: rubros }] = await Promise.all([
    supabase.from('plantillas').select('*').order('orden', { ascending: true }),
    supabase.from('rubros').select('*').order('orden', { ascending: true }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Empezar desde una plantilla
        </h1>
        <p className="text-sm text-muted-foreground">
          Elegí una plantilla por rubro y la clonamos como punto de partida.
        </p>
      </div>

      <PlantillasGaleria
        plantillas={(plantillas ?? []) as Plantilla[]}
        rubros={(rubros ?? []) as Rubro[]}
      />
    </div>
  )
}
