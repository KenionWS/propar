'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  Library,
  Wallet,
  Settings,
  LogOut,
  Plus,
  Shield,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/Logo'

const NAV = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/propuestas', label: 'Propuestas', icon: FileText, exact: false },
  { href: '/biblioteca', label: 'Biblioteca', icon: Library, exact: false },
  { href: '/cobros', label: 'Cobros', icon: Wallet, exact: false },
  { href: '/configuracion', label: 'Configuración', icon: Settings, exact: false },
]

export function Sidebar({
  empresaNombre,
  esAdmin = false,
}: {
  empresaNombre?: string
  esAdmin?: boolean
}) {
  const pathname = usePathname()
  const router = useRouter()
  const nav = esAdmin
    ? [
        ...NAV,
        { href: '/admin', label: 'Admin', icon: Shield, exact: false },
      ]
    : NAV

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
    router.refresh()
  }

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-background">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Logo variant="full" size={20} />
      </div>

      <div className="px-3 py-4">
        <Button asChild className="w-full justify-start gap-2">
          <Link href="/propuestas/nueva">
            <Plus className="h-4 w-4" />
            Nueva propuesta
          </Link>
        </Button>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {nav.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-brand-accent/10 text-brand-accent'
                  : 'text-muted-foreground hover:bg-brand-accent/5 hover:text-brand-accent'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-3">
        {empresaNombre ? (
          <p className="mb-2 truncate px-3 text-xs text-muted-foreground">
            {empresaNombre}
          </p>
        ) : null}
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
