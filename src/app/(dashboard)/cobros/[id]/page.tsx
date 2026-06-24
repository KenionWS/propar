import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CobroDetalle } from '@/components/cobros/CobroDetalle'
import type { Propuesta, Item, Pago } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function CobroDetallePage({
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
    .select('*, items(*)')
    .eq('id', params.id)
    .eq('user_id', session.user.id)
    .single()

  if (!propuesta) notFound()

  const { data: pagos } = await supabase
    .from('pagos')
    .select('*')
    .eq('propuesta_id', params.id)
    .order('numero', { ascending: true })

  return (
    <CobroDetalle
      userId={session.user.id}
      propuesta={propuesta as Propuesta & { items: Item[] }}
      pagosIniciales={(pagos ?? []) as Pago[]}
    />
  )
}
