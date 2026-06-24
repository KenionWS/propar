import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Moneda, Propuesta, Item } from './types'

export function formatMoney(amount: number, moneda: Moneda): string {
  if (moneda === 'ARS') {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatRelativeTime(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es })
}

export function formatFechaLarga(date: Date = new Date()): string {
  return date.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function isVencida(propuesta: Propuesta): boolean {
  if (!propuesta.enviada_at) return false
  if (propuesta.estado === 'aceptada') return false
  const vencimiento = new Date(propuesta.enviada_at)
  vencimiento.setDate(vencimiento.getDate() + propuesta.vigencia_dias)
  return new Date() > vencimiento
}

export function fechaVencimiento(propuesta: Propuesta): string {
  if (!propuesta.enviada_at) return ''
  const vencimiento = new Date(propuesta.enviada_at)
  vencimiento.setDate(vencimiento.getDate() + propuesta.vigencia_dias)
  return vencimiento.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function fechaVencimientoDesde(
  enviadaAt: string | null,
  vigenciaDias: number
): string {
  if (!enviadaAt) {
    const v = new Date()
    v.setDate(v.getDate() + vigenciaDias)
    return v.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }
  const v = new Date(enviadaAt)
  v.setDate(v.getDate() + vigenciaDias)
  return v.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/** Items que cuentan para el total: todos salvo los rechazados explícitamente. */
export function itemsIncluidos(items: Item[]): Item[] {
  return items.filter((i) => i.aceptado !== false)
}

/** Total formateado contando solo los items incluidos (no rechazados). */
export function formatTotalesIncluidos(items: Item[]): string {
  return formatTotales(itemsIncluidos(items))
}

/** Suma items agrupando por moneda. */
export function totalesPorMoneda(items: Item[]): Record<Moneda, number> {
  const totales: Record<Moneda, number> = { ARS: 0, USD: 0 }
  for (const item of items) {
    totales[item.moneda] += Number(item.precio) || 0
  }
  return totales
}

/** Devuelve string con total(es) formateado(s), con " + " si hay mix. */
export function formatTotales(items: Item[]): string {
  const totales = totalesPorMoneda(items)
  const partes: string[] = []
  if (totales.ARS > 0) partes.push(formatMoney(totales.ARS, 'ARS'))
  if (totales.USD > 0) partes.push(formatMoney(totales.USD, 'USD'))
  if (partes.length === 0) return formatMoney(0, 'ARS')
  return partes.join(' + ')
}

/** Iniciales a partir de un nombre. */
export function getIniciales(nombre: string): string {
  const palabras = nombre.trim().split(/\s+/).filter(Boolean)
  if (palabras.length === 0) return '?'
  if (palabras.length === 1) return palabras[0].slice(0, 2).toUpperCase()
  return (palabras[0][0] + palabras[palabras.length - 1][0]).toUpperCase()
}

const AVATAR_COLORS = [
  '#0ea5e9',
  '#8b5cf6',
  '#ec4899',
  '#f97316',
  '#10b981',
  '#6366f1',
  '#ef4444',
  '#14b8a6',
]

/** Color determinístico a partir de un string. */
export function colorDesdeNombre(nombre: string): string {
  let hash = 0
  for (let i = 0; i < nombre.length; i++) {
    hash = nombre.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}
