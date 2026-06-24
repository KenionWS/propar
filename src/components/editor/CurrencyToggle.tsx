'use client'

import { cn } from '@/lib/utils'
import type { Moneda } from '@/lib/types'

export function CurrencyToggle({
  value,
  onChange,
  size = 'default',
}: {
  value: Moneda
  onChange: (m: Moneda) => void
  size?: 'default' | 'sm'
}) {
  const opciones: Moneda[] = ['ARS', 'USD']
  return (
    <div className="inline-flex rounded-md border bg-muted p-0.5">
      {opciones.map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={cn(
            'rounded px-3 font-medium transition-colors',
            size === 'sm' ? 'py-1 text-xs' : 'py-1.5 text-sm',
            value === m
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {m}
        </button>
      ))}
    </div>
  )
}
