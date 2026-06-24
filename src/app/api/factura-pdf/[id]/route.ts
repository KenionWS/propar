import { NextResponse, type NextRequest } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import QRCode from 'qrcode'
import { createClient } from '@/lib/supabase/server'
import { FacturaPDF } from '@/components/cobros/FacturaPDF'
import {
  afipConfig,
  buildQrUrl,
  documentoReceptor,
  CBTE_FACTURA_C,
} from '@/lib/afip'
import type { Pago, Propuesta, Profile } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
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

  const { data: pago } = await supabase
    .from('pagos')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!pago) {
    return NextResponse.json({ error: 'Cuota no encontrada' }, { status: 404 })
  }

  const p = pago as Pago

  const [{ data: propuesta }, { data: profile }] = await Promise.all([
    supabase.from('propuestas').select('*').eq('id', p.propuesta_id).single(),
    supabase.from('profiles').select('*').eq('id', session.user.id).single(),
  ])

  const config = afipConfig()
  const borrador = !p.factura_cae

  // QR real solo cuando hay CAE (comprobante emitido)
  let qrDataUrl: string | null = null
  if (!borrador && config.cuit) {
    const prop = propuesta as Propuesta | null
    const { docTipo, docNro } = documentoReceptor(prop?.cliente_documento)
    const url = buildQrUrl({
      fecha: (p.facturado_at ?? new Date().toISOString()).slice(0, 10),
      cuit: config.cuit,
      ptoVta: config.puntoVenta,
      tipoCmp: CBTE_FACTURA_C,
      nroCmp: Number(p.factura_numero) || 0,
      importe: Number(p.monto),
      moneda: p.moneda === 'USD' ? 'DOL' : 'PES',
      ctz: 1,
      tipoDocRec: docTipo,
      nroDocRec: docNro,
      codAut: p.factura_cae ?? '',
    })
    qrDataUrl = await QRCode.toDataURL(url, { margin: 1, width: 240 })
  }

  const buffer = await renderToBuffer(
    FacturaPDF({
      pago: p,
      propuesta: propuesta as Propuesta,
      profile: (profile ?? null) as Profile | null,
      cuit: config.cuit,
      puntoVenta: config.puntoVenta,
      qrDataUrl,
      borrador,
    })
  )

  const nombre = borrador
    ? `factura-borrador-cuota-${p.numero}.pdf`
    : `factura-${p.factura_numero ?? p.numero}.pdf`

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${nombre}"`,
    },
  })
}
