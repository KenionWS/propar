import { createServiceClient } from '@/lib/supabase/server'
import { sendEmail, emailPropuestaVista } from '@/lib/email'
import type { Propuesta } from '@/lib/types'

/**
 * Registra una visita a una propuesta, actualiza el estado a 'vista'
 * si correspondía, y notifica al dueño la primera vez.
 * Usa el service client para saltar RLS.
 */
export async function registrarVisita(args: {
  slug: string
  ip?: string | null
  userAgent?: string | null
}): Promise<Propuesta | null> {
  const supabase = createServiceClient()

  const { data: propuesta } = await supabase
    .from('propuestas')
    .select('*')
    .eq('slug', args.slug)
    .single()

  if (!propuesta) return null

  // Registrar la visita
  await supabase.from('visitas').insert({
    propuesta_id: propuesta.id,
    ip: args.ip ?? null,
    user_agent: args.userAgent ?? null,
  })

  // Primera apertura real: estaba 'enviada' y nunca fue vista
  const esPrimeraApertura =
    propuesta.estado === 'enviada' && !propuesta.vista_primera_vez_at

  if (propuesta.estado === 'enviada') {
    await supabase
      .from('propuestas')
      .update({
        estado: 'vista',
        vista_primera_vez_at:
          propuesta.vista_primera_vez_at ?? new Date().toISOString(),
      })
      .eq('id', propuesta.id)
  }

  if (esPrimeraApertura) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('empresa_email')
      .eq('id', propuesta.user_id)
      .single()

    if (profile?.empresa_email) {
      await sendEmail(
        emailPropuestaVista({
          to: profile.empresa_email,
          titulo: propuesta.titulo,
          cliente: propuesta.cliente_nombre,
        })
      )
    }
  }

  return propuesta as Propuesta
}
