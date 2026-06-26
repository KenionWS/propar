import { NextResponse, type NextRequest } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createServiceClient } from '@/lib/supabase/server'
import { ProposalPDF } from '@/components/proposal/ProposalPDF'
import { slugify } from '@/lib/utils'
import type { Propuesta, Item, Profile } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServiceClient()

  const { data: propuesta } = await supabase
    .from('propuestas')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!propuesta) {
    return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  }

  const [{ data: items }, { data: profile }] = await Promise.all([
    supabase
      .from('items')
      .select('*')
      .eq('propuesta_id', params.id)
      .order('orden', { ascending: true }),
    supabase
      .from('profiles')
      .select('*')
      .eq('id', propuesta.user_id)
      .single(),
  ])

  const buffer = await renderToBuffer(
    ProposalPDF({
      propuesta: propuesta as Propuesta,
      items: (items ?? []) as Item[],
      profile: (profile ?? null) as Profile | null,
    })
  )

  const filename = `propuesta-${slugify(propuesta.titulo || 'cotizia')}.pdf`

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
    },
  })
}
