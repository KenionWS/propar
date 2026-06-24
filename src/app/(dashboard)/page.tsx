import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { StatCards } from '@/components/dashboard/StatCards'
import { ProposalRow } from '@/components/dashboard/ProposalRow'
import { calcularStats } from '@/lib/stats'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, FileText } from 'lucide-react'
import type { Propuesta, Item } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
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
  const stats = calcularStats(propuestas)
  const recientes = propuestas.slice(0, 10)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Resumen de tu actividad comercial.
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/propuestas/nueva">
            <Plus className="h-4 w-4" />
            Nueva propuesta
          </Link>
        </Button>
      </div>

      <StatCards stats={stats} />

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Propuestas recientes</h2>
          <Link
            href="/propuestas"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Ver todas
          </Link>
        </div>

        <Card className="divide-y overflow-hidden">
          {recientes.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/40" />
              <div>
                <p className="font-medium">Todavía no tenés propuestas</p>
                <p className="text-sm text-muted-foreground">
                  Creá tu primera propuesta para empezar.
                </p>
              </div>
              <Button asChild size="sm" className="gap-2">
                <Link href="/propuestas/nueva">
                  <Plus className="h-4 w-4" />
                  Nueva propuesta
                </Link>
              </Button>
            </div>
          ) : (
            recientes.map((p) => <ProposalRow key={p.id} propuesta={p} />)
          )}
        </Card>
      </div>
    </div>
  )
}
