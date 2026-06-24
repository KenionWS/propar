import { NextResponse, type NextRequest } from 'next/server'
import { registrarVisita } from '@/lib/tracking'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    null
  const userAgent = request.headers.get('user-agent')

  const propuesta = await registrarVisita({
    slug: params.slug,
    ip,
    userAgent,
  })

  if (!propuesta) {
    return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
