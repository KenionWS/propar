import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const supabase = createServiceClient()

  let motivo: string | null = null
  try {
    const body = await request.json()
    if (typeof body?.motivo === 'string' && body.motivo.trim()) {
      motivo = body.motivo.trim()
    }
  } catch {
    // sin body
  }

  const { data: propuesta } = await supabase
    .from('propuestas')
    .select('id, estado')
    .eq('slug', params.slug)
    .single()

  if (!propuesta) {
    return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  }

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

  const { error } = await supabase
    .from('propuestas')
    .update({
      estado: 'rechazada',
      rechazada_at: new Date().toISOString(),
      motivo_rechazo: motivo,
    })
    .eq('id', propuesta.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
