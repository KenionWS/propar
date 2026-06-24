import type { Pago, Moneda } from './types'
import { formatMoney } from './formatters'

export type EstadoCuota = 'pagado' | 'vencido' | 'pendiente'

/** Estado de una cuota según su fecha y si está paga. */
export function estadoCuota(pago: Pago): EstadoCuota {
  if (pago.pagado) return 'pagado'
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const vto = new Date(pago.vencimiento + 'T00:00:00')
  return vto < hoy ? 'vencido' : 'pendiente'
}

/** Suma montos por moneda de un conjunto de pagos. */
export function sumarPorMoneda(pagos: Pago[]): Record<Moneda, number> {
  const acc: Record<Moneda, number> = { ARS: 0, USD: 0 }
  for (const p of pagos) acc[p.moneda] += Number(p.monto) || 0
  return acc
}

/** Formatea totales por moneda en un string ("$X ARS + $Y USD"). */
export function formatMontos(totales: Record<Moneda, number>): string {
  const partes: string[] = []
  if (totales.ARS > 0) partes.push(formatMoney(totales.ARS, 'ARS'))
  if (totales.USD > 0) partes.push(formatMoney(totales.USD, 'USD'))
  return partes.length ? partes.join(' + ') : formatMoney(0, 'ARS')
}

function esMismoMes(fecha: string, ref: Date): boolean {
  const d = new Date(fecha + 'T00:00:00')
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth()
}

export interface CobrosStats {
  cobrado: string
  pendiente: string
  vencido: string
  esteMes: string
  hayVencidas: boolean
}

/** Stats globales sobre todos los pagos del usuario. */
export function calcularCobrosStats(pagos: Pago[]): CobrosStats {
  const ahora = new Date()
  const pagados = pagos.filter((p) => p.pagado)
  const impagos = pagos.filter((p) => !p.pagado)
  const vencidos = impagos.filter((p) => estadoCuota(p) === 'vencido')
  const esteMes = impagos.filter((p) => esMismoMes(p.vencimiento, ahora))

  return {
    cobrado: formatMontos(sumarPorMoneda(pagados)),
    pendiente: formatMontos(sumarPorMoneda(impagos)),
    vencido: formatMontos(sumarPorMoneda(vencidos)),
    esteMes: formatMontos(sumarPorMoneda(esteMes)),
    hayVencidas: vencidos.length > 0,
  }
}

/** Fecha de vencimiento legible. */
export function formatVencimiento(fecha: string): string {
  return new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
