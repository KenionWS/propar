import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generarFactura } from '@/lib/afip/emitir'
import { sendEmail, emailFactura } from '@/lib/email'
import { formatMoney } from '@/lib/formatters'
import type { Pago, Propuesta, Profile } from '@/lib/types'

export const dynamic = 'force-dynamic'

// POST /api/facturar/[id]  body: { accion?: 'facturar' | 'enviar' }
// [id] = id de la cuota (pago). Solo el dueño (RLS) puede facturar.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  let accion: 'facturar' | 'enviar' = 'facturar'
  try {
    const body = await request.json()
    if (body?.accion === 'enviar') accion = 'enviar'
  } catch {
    // default facturar
  }

  // RLS asegura que solo se acceda a cuotas propias
  const { data: pago } = await supabase
    .from('pagos')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!pago) {
    return NextResponse.json({ error: 'Cuota no encontrada' }, { status: 404 })
  }

  const { data: propuesta } = await supabase
    .from('propuestas')
    .select('*')
    .eq('id', (pago as Pago).propuesta_id)
    .single()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  const prop = propuesta as Propuesta | null
  const prof = profile as Profile | null
  const p = pago as Pago

  // ---------------------------------------------------------------
  // ENVIAR factura ya emitida al cliente
  // ---------------------------------------------------------------
  if (accion === 'enviar') {
    if (p.factura_estado !== 'facturada') {
      return NextResponse.json(
        { error: 'Primero hay que emitir la factura.' },
        { status: 400 }
      )
    }
    if (!prop?.cliente_email) {
      return NextResponse.json(
        { error: 'El cliente no tiene email cargado.' },
        { status: 400 }
      )
    }
    await sendEmail(
      emailFactura({
        to: prop.cliente_email,
        cliente: prop.cliente_nombre,
        empresa: prof?.empresa_nombre || 'PropAR',
        numero: p.factura_numero || 's/n',
        monto: formatMoney(Number(p.monto), p.moneda),
        url: p.factura_url,
      })
    )
    await supabase
      .from('pagos')
      .update({ factura_estado: 'enviada' })
      .eq('id', p.id)

    return NextResponse.json({ ok: true, factura_estado: 'enviada' })
  }

  // ---------------------------------------------------------------
  // FACTURAR (emitir comprobante vía AFIP — hoy stub)
  // ---------------------------------------------------------------
  const resultado = await generarFactura({
    cliente: {
      nombre: prop?.cliente_nombre ?? '',
      empresa: prop?.cliente_empresa ?? null,
      email: prop?.cliente_email ?? null,
      documento: prop?.cliente_documento ?? null,
    },
    concepto: prop?.titulo ?? 'Servicios',
    monto: Number(p.monto),
    moneda: p.moneda,
  })

  if (!resultado.ok) {
    // No marcamos error en la cuota si simplemente AFIP no está configurado.
    return NextResponse.json(
      { error: resultado.error ?? 'No se pudo facturar.' },
      { status: 400 }
    )
  }

  await supabase
    .from('pagos')
    .update({
      factura_estado: 'facturada',
      factura_numero: resultado.numero ?? null,
      factura_cae: resultado.cae ?? null,
      factura_url: resultado.url ?? null,
      facturado_at: new Date().toISOString(),
    })
    .eq('id', p.id)

  return NextResponse.json({ factura_estado: 'facturada', ...resultado })
}
