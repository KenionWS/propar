import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('empresa_nombre, es_admin')
    .eq('id', session.user.id)
    .single()

  return (
    <div className="flex h-screen overflow-hidden bg-muted/20">
      <div className="hidden md:block">
        <Sidebar
          empresaNombre={profile?.empresa_nombre || undefined}
          esAdmin={profile?.es_admin ?? false}
        />
      </div>
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">{children}</div>
      </main>
    </div>
  )
}
