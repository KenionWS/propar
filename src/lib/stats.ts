import type { Propuesta, Item } from './types'
import { formatTotales, totalesPorMoneda } from './formatters'
import type { Stats } from '@/components/dashboard/StatCards'

type PropuestaConItems = Propuesta & { items: Item[] }

export function calcularStats(propuestas: PropuestaConItems[]): Stats {
  const ahora = new Date()
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
  const hace30 = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Enviadas este mes
  const enviadasMes = propuestas.filter(
    (p) => p.enviada_at && new Date(p.enviada_at) >= inicioMes
  ).length

  // Tasa de cierre (aceptadas / enviadas en últimos 30 días)
  const enviadas30 = propuestas.filter(
    (p) => p.enviada_at && new Date(p.enviada_at) >= hace30
  )
  const aceptadas30 = enviadas30.filter(
    (p) => p.estado === 'aceptada' || p.estado === 'aceptada_parcial'
  )
  const tasaCierre =
    enviadas30.length > 0 ? (aceptadas30.length / enviadas30.length) * 100 : 0

  // Valor en pipeline: items de propuestas enviada o vista
  const enPipeline = propuestas.filter(
    (p) => p.estado === 'enviada' || p.estado === 'vista'
  )
  const itemsPipeline = enPipeline.flatMap((p) => p.items ?? [])
  const totalesPipeline = totalesPorMoneda(itemsPipeline)
  const pipelineLabel =
    totalesPipeline.ARS === 0 && totalesPipeline.USD === 0
      ? '—'
      : formatTotales(itemsPipeline)

  // Tiempo promedio de respuesta (enviada_at → vista_primera_vez_at)
  const conRespuesta = propuestas.filter(
    (p) => p.enviada_at && p.vista_primera_vez_at
  )
  let tiempoRespuestaDias: number | null = null
  if (conRespuesta.length > 0) {
    const totalMs = conRespuesta.reduce((acc, p) => {
      const e = new Date(p.enviada_at!).getTime()
      const v = new Date(p.vista_primera_vez_at!).getTime()
      return acc + Math.max(0, v - e)
    }, 0)
    tiempoRespuestaDias = totalMs / conRespuesta.length / (24 * 60 * 60 * 1000)
  }

  return {
    enviadasMes,
    tasaCierre,
    pipelineLabel,
    tiempoRespuestaDias,
  }
}
