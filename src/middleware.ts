import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const PUBLIC_PREFIXES = [
  '/login',
  '/p/',
  '/api/track',
  '/api/aceptar',
  '/api/rechazar',
  '/api/pdf',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublic =
    PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    pathname === '/p'

  const { res, session } = await updateSession(request)

  // Rutas públicas: no requieren auth
  if (isPublic) {
    return res
  }

  // Sin sesión y ruta protegida → login
  if (!session) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match a todas las rutas excepto:
     * - _next/static, _next/image
     * - favicon.ico
     * - archivos públicos (svg, png, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
