import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CobrosList } from '@/components/cobros/CobrosList'
import type { Propuesta, Item, Pago } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function CobrosPage() {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const userId = session.user.id

  const [{ data: propuestas }, { data: pagos }] = await Promise.all([
    supabase
      .from('propuestas')
      .select('*, items(*)')
      .eq('user_id', userId)
      .in('estado', ['aceptada', 'aceptada_parcial'])
      .order('aceptada_at', { ascending: false }),
    supabase
      .from('pagos')
      .select('*')
      .eq('user_id', userId)
      .order('numero', { ascending: true }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cobros</h1>
        <p className="text-sm text-muted-foreground">
          Seguimiento de pagos de tus propuestas cerradas.
        </p>
      </div>

      <CobrosList
        propuestas={(propuestas ?? []) as (Propuesta & { items: Item[] })[]}
        pagos={(pagos ?? []) as Pago[]}
      />
    </div>
  )
}
