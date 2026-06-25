import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProposalList } from '@/components/dashboard/ProposalList'
import { Button } from '@/components/ui/button'
import { Plus, LayoutTemplate } from 'lucide-react'
import type { Propuesta, Item } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function PropuestasPage() {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { data } = await supabase
    .from('propuestas')
    .select('*, items(*)')
    .eq('user_id', session!.user.id)
    .order('created_at', { ascending: false })

  const propuestas = (data ?? []) as (Propuesta & { items: Item[] })[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Propuestas</h1>
          <p className="text-sm text-muted-foreground">
            {propuestas.length} propuesta{propuestas.length === 1 ? '' : 's'} en
            total.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="gap-2">
            <Link href="/propuestas/plantillas">
              <LayoutTemplate className="h-4 w-4" />
              Desde plantilla
            </Link>
          </Button>
          <Button asChild className="gap-2">
            <Link href="/propuestas/nueva">
              <Plus className="h-4 w-4" />
              Nueva propuesta
            </Link>
          </Button>
        </div>
      </div>

      <ProposalList propuestas={propuestas} />
    </div>
  )
}
