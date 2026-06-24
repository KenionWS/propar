import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { generarSlug } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function NuevaPropuestaPage() {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  const { data, error } = await supabase
    .from('propuestas')
    .insert({
      user_id: session.user.id,
      slug: generarSlug('borrador'),
      titulo: '',
      cliente_nombre: '',
      moneda: 'ARS',
      vigencia_dias: 15,
      estado: 'borrador',
    })
    .select('id')
    .single()

  if (error || !data) {
    throw new Error('No se pudo crear la propuesta: ' + (error?.message ?? ''))
  }

  redirect(`/propuestas/${data.id}`)
}
