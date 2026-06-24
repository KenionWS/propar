import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProposalEditor } from '@/components/editor/ProposalEditor'
import type { Propuesta, Item } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function EditarPropuestaPage({
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

  const { data: items } = await supabase
    .from('items')
    .select('*')
    .eq('propuesta_id', params.id)
    .order('orden', { ascending: true })

  return (
    <ProposalEditor
      propuesta={propuesta as Propuesta}
      initialItems={(items ?? []) as Item[]}
    />
  )
}
