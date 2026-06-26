import { cn } from '@/lib/utils'

// Los colores de marca van hardcodeados acá a propósito (es el único lugar).
const ACCENT = '#3B82F6'
const DARK = '#0F172A'
const FONT = "'Plus Jakarta Sans', system-ui, sans-serif"

export function Logo({
  variant = 'full',
  dark = false,
  size = 20,
  className,
}: {
  variant?: 'icon' | 'wordmark' | 'full'
  /** true cuando el logo va sobre fondo oscuro */
  dark?: boolean
  /** tamaño de fuente del wordmark en px (el squircle escala con esto) */
  size?: number
  className?: string
}) {
  const squircleBg = dark ? ACCENT : DARK
  const colorC = dark ? '#ffffff' : ACCENT
  const colorResto = dark ? '#ffffff' : DARK

  const lado = variant === 'icon' ? Math.round(size * 1.8) : Math.round(size * 1.6)
  const radio = Math.round(lado * 0.25)
  const letra = Math.round(lado * 0.55)

  const squircle = (
    <span
      style={{
        width: lado,
        height: lado,
        borderRadius: radio,
        backgroundColor: squircleBg,
        color: '#ffffff',
        fontFamily: FONT,
        fontWeight: 800,
        fontSize: letra,
        lineHeight: 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      C
    </span>
  )

  const wordmark = (
    <span
      style={{
        fontFamily: FONT,
        fontWeight: 800,
        letterSpacing: '-0.5px',
        fontSize: size,
        lineHeight: 1,
      }}
    >
      <span style={{ color: colorC }}>c</span>
      <span style={{ color: colorResto }}>otizia</span>
    </span>
  )

  if (variant === 'icon') {
    return <span className={className}>{squircle}</span>
  }
  if (variant === 'wordmark') {
    return <span className={className}>{wordmark}</span>
  }
  return (
    <span
      className={cn('inline-flex items-center', className)}
      style={{ gap: 10 }}
    >
      {squircle}
      {wordmark}
    </span>
  )
}
