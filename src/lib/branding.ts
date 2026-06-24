// Registro central de opciones de branding. Lo usan el formulario de
// configuración, la vista pública de la propuesta y el PDF.

export interface FuenteOption {
  value: string
  label: string
  stack: string
  /** Familia equivalente soportada por @react-pdf/renderer. */
  pdf: 'Helvetica' | 'Times-Roman'
}

export const FUENTES: FuenteOption[] = [
  {
    value: 'Inter',
    label: 'Inter — moderna (default)',
    stack: "'Inter', system-ui, sans-serif",
    pdf: 'Helvetica',
  },
  {
    value: 'Poppins',
    label: 'Poppins — geométrica',
    stack: "'Poppins', system-ui, sans-serif",
    pdf: 'Helvetica',
  },
  {
    value: 'Montserrat',
    label: 'Montserrat — corporativa',
    stack: "'Montserrat', system-ui, sans-serif",
    pdf: 'Helvetica',
  },
  {
    value: 'Lora',
    label: 'Lora — serif clásica',
    stack: "'Lora', Georgia, serif",
    pdf: 'Times-Roman',
  },
  {
    value: 'Playfair Display',
    label: 'Playfair Display — elegante',
    stack: "'Playfair Display', Georgia, serif",
    pdf: 'Times-Roman',
  },
]

export function fuenteStack(value: string | null | undefined): string {
  return FUENTES.find((f) => f.value === value)?.stack ?? FUENTES[0].stack
}

export function fuentePdf(value: string | null | undefined): {
  base: string
  bold: string
} {
  const f = FUENTES.find((x) => x.value === value) ?? FUENTES[0]
  if (f.pdf === 'Times-Roman') {
    return { base: 'Times-Roman', bold: 'Times-Bold' }
  }
  return { base: 'Helvetica', bold: 'Helvetica-Bold' }
}

export const LOGO_TAMANOS = [
  { value: 'chico', label: 'Chico', px: 32 },
  { value: 'mediano', label: 'Mediano', px: 48 },
  { value: 'grande', label: 'Grande', px: 72 },
] as const

export function logoPx(value: string | null | undefined): number {
  return LOGO_TAMANOS.find((l) => l.value === value)?.px ?? 48
}

export const DENSIDADES = [
  { value: 'compacto', label: 'Compacto' },
  { value: 'normal', label: 'Normal' },
  { value: 'amplio', label: 'Amplio' },
] as const

export interface DensidadEspaciado {
  /** padding vertical del contenedor en px */
  pagePadding: number
  /** separación vertical entre bloques principales en px */
  blockGap: number
  /** separación entre items en px */
  itemGap: number
}

export function densidadEspaciado(
  value: string | null | undefined
): DensidadEspaciado {
  switch (value) {
    case 'compacto':
      return { pagePadding: 24, blockGap: 16, itemGap: 12 }
    case 'amplio':
      return { pagePadding: 56, blockGap: 36, itemGap: 28 }
    default:
      return { pagePadding: 40, blockGap: 24, itemGap: 20 }
  }
}
