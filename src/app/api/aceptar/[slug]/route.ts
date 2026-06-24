import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendEmail, emailPropuestaAceptada } from '@/lib/email'
import { formatTotales } from '@/lib/formatters'
import type { Item } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const supabase = createServiceClient()

  let bloquesAceptados: string[] | undefined
  let motivo: string | null = null
  try {
    const body = await request.json()
    if (Array.isArray(body?.bloquesAceptados)) {
      bloquesAceptados = body.bloquesAceptados as string[]
    }
    if (typeof body?.motivo === 'string' && body.motivo.trim()) {
      motivo = body.motivo.trim()
    }
  } catch {
    // sin body (aceptación completa)
  }

  const { data: propuesta } = await supabase
    .from('propuestas')
    .select('*')
    .eq('slug', params.slug)
    .single()

  if (!propuesta) {
    return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  }

  // Una vez que el cliente respondió, no puede volver a cambiarlo.
  if (
    propuesta.estado === 'aceptada' ||
    propuesta.estado === 'aceptada_parcial' ||
    propuesta.estado === 'rechazada'
  ) {
    return NextResponse.json(
      { error: 'Esta propuesta ya fue respondida.', yaRespondida: true },
      { status: 409 }
    )
  }

  const { data: itemsData } = await supabase
    .from('items')
    .select('*')
    .eq('propuesta_id', propuesta.id)

  const items = (itemsData ?? []) as Item[]

  const esPorBloques =
    propuesta.modo_aceptacion === 'por_bloques' &&
    Array.isArray(bloquesAceptados)

  let estado: 'aceptada' | 'aceptada_parcial' = 'aceptada'
  let itemsIncluidos = items

  if (esPorBloques) {
    const aceptados = new Set(bloquesAceptados)
    // Marcar cada item según la selección del cliente
    const { error: e1 } = await supabase
      .from('items')
      .update({ aceptado: false })
      .eq('propuesta_id', propuesta.id)
    if (e1) {
      console.error('[aceptar] error marcando items aceptado=false:', e1)
      return NextResponse.json(
        { error: 'No se pudo marcar los bloques: ' + e1.message },
        { status: 500 }
      )
    }
    if (aceptados.size > 0) {
      const { error: e2 } = await supabase
        .from('items')
        .update({ aceptado: true })
        .eq('propuesta_id', propuesta.id)
        .in('id', Array.from(aceptados))
      if (e2) {
        console.error('[aceptar] error marcando items aceptado=true:', e2)
        return NextResponse.json(
          { error: 'No se pudo marcar los bloques: ' + e2.message },
          { status: 500 }
        )
      }
    }
    estado = 'aceptada_parcial'
    itemsIncluidos = items.filter((i) => aceptados.has(i.id))
  }

  const todoIncluido = itemsIncluidos.length === items.length

  const { data: actualizada, error } = await supabase
    .from('propuestas')
    .update({
      estado,
      aceptada_at: new Date().toISOString(),
      // motivo solo si dejó bloques afuera
      motivo_rechazo: !todoIncluido ? motivo : null,
    })
    .eq('id', propuesta.id)
    .select('id')

  if (error) {
    console.error('[aceptar] error actualizando estado:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!actualizada || actualizada.length === 0) {
    console.error('[aceptar] el update no afectó ninguna fila (RLS/permiso)')
    return NextResponse.json(
      {
        error:
          'No se pudo guardar el cambio de estado (0 filas afectadas). ' +
          'Revisá que SUPABASE_SERVICE_ROLE_KEY sea la service_role/secret correcta.',
      },
      { status: 500 }
    )
  }

  // Notificar al dueño
  const { data: profile } = await supabase
    .from('profiles')
    .select('empresa_email')
    .eq('id', propuesta.user_id)
    .single()

  if (profile?.empresa_email) {
    await sendEmail(
      emailPropuestaAceptada({
        to: profile.empresa_email,
        titulo: propuesta.titulo,
        cliente: propuesta.cliente_nombre,
        monto: formatTotales(itemsIncluidos),
        parcial: estado === 'aceptada_parcial',
        cantidadBloques: esPorBloques
          ? `${itemsIncluidos.length} de ${items.length}`
          : undefined,
      })
    )
  }

  return NextResponse.json({ ok: true, estado })
}
