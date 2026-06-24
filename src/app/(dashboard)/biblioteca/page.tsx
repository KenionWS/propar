import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BibliotecaManager } from '@/components/biblioteca/BibliotecaManager'
import type { Bloque } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function BibliotecaPage() {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data } = await supabase
    .from('bloques')
    .select('*')
    .eq('user_id', session.user.id)
    .order('veces_usado', { ascending: false })
    .order('updated_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Biblioteca</h1>
        <p className="text-sm text-muted-foreground">
          Bloques reutilizables para armar propuestas más rápido.
        </p>
      </div>

      <BibliotecaManager
        userId={session.user.id}
        initial={(data ?? []) as Bloque[]}
      />
    </div>
  )
}
