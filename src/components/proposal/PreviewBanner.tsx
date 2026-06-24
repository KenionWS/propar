'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, Copy, Download, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { generarSlug } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { Estado } from '@/lib/types'

export function PreviewBanner({
  id,
  slug,
  estado,
  clienteNombre,
  enviadaAt,
}: {
  id: string
  slug: string
  estado: Estado
  clienteNombre: string
  enviadaAt: string | null
}) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [currentSlug, setCurrentSlug] = useState(slug)

  async function copiarYEnviar() {
    setLoading(true)
    let finalSlug = currentSlug
    if (estado === 'borrador' && currentSlug.startsWith('borrador-')) {
      finalSlug = generarSlug(clienteNombre || 'propuesta')
    }

    const update: Record<string, unknown> = { slug: finalSlug }
    if (estado === 'borrador') {
      update.estado = 'enviada'
      update.enviada_at = enviadaAt ?? new Date().toISOString()
    }

    const { error } = await supabase
      .from('propuestas')
      .update(update)
      .eq('id', id)

    setLoading(false)
    if (error) {
      toast.error('Error: ' + error.message)
      return
    }

    setCurrentSlug(finalSlug)
    navigator.clipboard.writeText(`${window.location.origin}/p/${finalSlug}`)
    toast.success('Link copiado. Propuesta marcada como enviada.')
    router.refresh()
  }

  return (
    <div className="sticky top-0 z-20 border-b border-amber-300 bg-amber-100 px-4 py-2.5">
      <div className="mx-auto flex max-w-2xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-amber-900">
          Vista previa — el cliente no puede ver esta barra.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild className="gap-1.5 bg-white">
            <Link href={`/propuestas/${id}`}>
              <ArrowLeft className="h-3.5 w-3.5" />
              Volver a editar
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 bg-white"
            onClick={() => window.open(`/api/pdf/${id}`, '_blank')}
          >
            <Download className="h-3.5 w-3.5" />
            PDF
          </Button>
          <Button size="sm" className="gap-1.5" onClick={copiarYEnviar} disabled={loading}>
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            Copiar link y marcar como enviada
          </Button>
        </div>
      </div>
    </div>
  )
}
