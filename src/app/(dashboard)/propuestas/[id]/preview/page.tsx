import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProposalView } from '@/components/proposal/ProposalView'
import { PreviewBanner } from '@/components/proposal/PreviewBanner'
import type { Propuesta, Item, Profile } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function PreviewPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: propuesta } = await supabase
    .from('propuestas')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', session.user.id)
    .single()

  if (!propuesta) notFound()

  const [{ data: items }, { data: profile }] = await Promise.all([
    supabase
      .from('items')
      .select('*')
      .eq('propuesta_id', params.id)
      .order('orden', { ascending: true }),
    supabase.from('profiles').select('*').eq('id', session.user.id).single(),
  ])

  const prop = propuesta as Propuesta

  return (
    <div className="-mx-4 -my-8 min-h-screen bg-white md:-mx-8">
      <PreviewBanner
        id={prop.id}
        slug={prop.slug}
        estado={prop.estado}
        clienteNombre={prop.cliente_nombre}
        enviadaAt={prop.enviada_at}
      />
      <ProposalView
        propuesta={prop}
        items={(items ?? []) as Item[]}
        profile={(profile ?? null) as Profile | null}
      />
    </div>
  )
}
