import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ConfigForm } from '@/components/config/ConfigForm'
import type { Profile } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function ConfiguracionPage() {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  // Fallback: si el trigger no creó el perfil, crearlo ahora.
  if (!profile) {
    const { data: nuevo } = await supabase
      .from('profiles')
      .insert({ id: session.user.id })
      .select('*')
      .single()
    profile = nuevo
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        <p className="text-sm text-muted-foreground">
          Estos datos aparecen en tus propuestas y en el footer.
        </p>
      </div>

      <ConfigForm
        userId={session.user.id}
        profile={profile as Profile}
      />
    </div>
  )
}
