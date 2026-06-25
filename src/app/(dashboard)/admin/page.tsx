import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminPanel } from '@/components/admin/AdminPanel'
import type { Rubro, Servicio, BloqueEjemplo } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('es_admin')
    .eq('id', session.user.id)
    .single()

  if (!profile?.es_admin) redirect('/')

  const [{ data: rubros }, { data: servicios }, { data: ejemplos }] =
    await Promise.all([
      supabase.from('rubros').select('*').order('orden', { ascending: true }),
      supabase.from('servicios').select('*').order('orden', { ascending: true }),
      supabase
        .from('bloques_ejemplo')
        .select('*')
        .order('orden', { ascending: true }),
    ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Administración</h1>
        <p className="text-sm text-muted-foreground">
          Catálogo de la plataforma: rubros, servicios y bloques de ejemplo.
        </p>
      </div>

      <AdminPanel
        rubros={(rubros ?? []) as Rubro[]}
        servicios={(servicios ?? []) as Servicio[]}
        ejemplos={(ejemplos ?? []) as BloqueEjemplo[]}
      />
    </div>
  )
}
