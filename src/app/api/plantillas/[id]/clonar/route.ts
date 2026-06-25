import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generarSlug } from '@/lib/utils'
import type { Plantilla, PlantillaItem } from '@/lib/types'

export const dynamic = 'force-dynamic'

// POST /api/plantillas/[id]/clonar
// Crea una propuesta borrador a partir de la plantilla y devuelve su id.
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { data: plantilla } = await supabase
    .from('plantillas')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!plantilla) {
    return NextResponse.json({ error: 'Plantilla no encontrada' }, { status: 404 })
  }
  const pl = plantilla as Plantilla

  const { data: prop, error } = await supabase
    .from('propuestas')
    .insert({
      user_id: session.user.id,
      slug: generarSlug('borrador'),
      titulo: pl.nombre,
      cliente_nombre: '',
      introduccion: pl.introduccion,
      terminos: pl.terminos,
      moneda: pl.moneda,
      vigencia_dias: pl.vigencia_dias,
      modo_aceptacion: pl.modo_aceptacion,
      estado: 'borrador',
    })
    .select('id')
    .single()

  if (error || !prop) {
    return NextResponse.json(
      { error: error?.message ?? 'No se pudo crear la propuesta' },
      { status: 500 }
    )
  }

  const items = (pl.items ?? []) as PlantillaItem[]
  if (items.length > 0) {
    const { error: iErr } = await supabase.from('items').insert(
      items.map((it, idx) => ({
        propuesta_id: prop.id,
        nombre: it.nombre,
        descripcion: it.descripcion,
        precio: it.precio,
        moneda: it.moneda,
        orden: idx,
        aceptado: true,
        caracteristicas: it.caracteristicas,
      }))
    )
    if (iErr) {
      return NextResponse.json({ error: iErr.message }, { status: 500 })
    }
  }

  return NextResponse.json({ id: prop.id })
}
