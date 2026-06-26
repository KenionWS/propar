'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Logo } from '@/components/Logo'

export default function LoginPage() {
  const router = useRouter()
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        router.replace('/')
        router.refresh()
      }
    })
    // Si ya hay sesión al cargar, redirigir
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace('/')
        router.refresh()
      }
    })
    return () => subscription.unsubscribe()
  }, [supabase, router])

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 flex flex-col items-center text-center">
        <Logo variant="full" size={28} />
        <p className="mt-3 text-sm text-muted-foreground">
          Propuestas comerciales profesionales
        </p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <Auth
            supabaseClient={supabase}
            view="sign_in"
            showLinks={false}
            providers={[]}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'var(--brand-accent)',
                    brandAccent: 'var(--brand-dark)',
                  },
                },
              },
            }}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Email',
                  password_label: 'Contraseña',
                  email_input_placeholder: 'tu@email.com',
                  password_input_placeholder: 'Tu contraseña',
                  button_label: 'Ingresar',
                  loading_button_label: 'Ingresando...',
                },
              },
            }}
          />
        </CardContent>
      </Card>
      <p className="mt-6 text-center text-xs text-muted-foreground">
        Acceso solo para usuarios autorizados.
      </p>
    </div>
  )
}
