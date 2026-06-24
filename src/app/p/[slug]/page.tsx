import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { Download } from 'lucide-react'
import { createServiceClient } from '@/lib/supabase/server'
import { registrarVisita } from '@/lib/tracking'
import { ProposalView } from '@/components/proposal/ProposalView'
import { AcceptActions } from '@/components/proposal/AcceptActions'
import { BlockAcceptFlow } from '@/components/proposal/BlockAcceptFlow'
import { Button } from '@/components/ui/button'
import { formatTotales, isVencida } from '@/lib/formatters'
import type { Propuesta, Item, Profile } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function PublicProposalPage({
  params,
}: {
  params: { slug: string }
}) {
  const supabase = createServiceClient()

  const { data: propuesta } = await supabase
    .from('propuestas')
    .select('*')
    .eq('slug', params.slug)
    .single()

  if (!propuesta) notFound()

  // No mostrar borradores públicamente
  if (propuesta.estado === 'borrador') notFound()

  const [{ data: items }, { data: profile }] = await Promise.all([
    supabase
      .from('items')
      .select('*')
      .eq('propuesta_id', propuesta.id)
      .order('orden', { ascending: true }),
    supabase
      .from('profiles')
      .select('*')
      .eq('id', propuesta.user_id)
      .single(),
  ])

  // Registrar visita server-side (tras cargar datos para no bloquear el render)
  const hdrs = headers()
  await registrarVisita({
    slug: params.slug,
    ip:
      hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      hdrs.get('x-real-ip') ||
      null,
    userAgent: hdrs.get('user-agent'),
  })

  const prop = propuesta as Propuesta
  const itemList = (items ?? []) as Item[]
  const prof = (profile ?? null) as Profile | null

  const vencida = isVencida(prop)
  const aceptada =
    prop.estado === 'aceptada' || prop.estado === 'aceptada_parcial'
  const rechazada = prop.estado === 'rechazada'
  const decidida = aceptada || rechazada
  const accionable = !decidida && !vencida
  const porBloques = prop.modo_aceptacion === 'por_bloques'
  const acento = prof?.color_acento ?? '#16a34a'
  const montoLabel = formatTotales(itemList)

  const pdfSlot = (
    <div className="flex justify-center">
      <a href={`/api/pdf/${prop.id}`} target="_blank" rel="noreferrer">
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Descargar PDF
        </Button>
      </a>
    </div>
  )

  let cuerpo = undefined
  let actionSlot = null

  if (accionable && porBloques) {
    cuerpo = (
      <BlockAcceptFlow
        slug={prop.slug}
        items={itemList}
        colorAcento={acento}
        empresaNombre={prof?.empresa_nombre ?? ''}
        clienteNombre={prop.cliente_nombre}
      />
    )
    actionSlot = pdfSlot
  } else if (accionable) {
    actionSlot = (
      <AcceptActions
        slug={prop.slug}
        propuestaId={prop.id}
        clienteNombre={prop.cliente_nombre}
        montoLabel={montoLabel}
        empresaNombre={prof?.empresa_nombre ?? ''}
        colorAcento={acento}
      />
    )
  } else {
    actionSlot = pdfSlot
  }

  return (
    <div className="min-h-screen bg-white">
      <ProposalView
        propuesta={prop}
        items={itemList}
        profile={prof}
        cuerpo={cuerpo}
        actionSlot={actionSlot}
      />
    </div>
  )
}
