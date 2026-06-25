export type Estado =
  | 'borrador'
  | 'enviada'
  | 'vista'
  | 'aceptada'
  | 'aceptada_parcial'
  | 'rechazada'
export type Moneda = 'ARS' | 'USD'
export type ModoAceptacion = 'completa' | 'por_bloques'

export interface Profile {
  id: string
  empresa_nombre: string
  empresa_logo_url: string | null
  empresa_web: string | null
  empresa_telefono: string | null
  empresa_email: string | null
  empresa_direccion: string | null
  es_admin: boolean
  color_primario: string
  color_acento: string
  fuente: string
  logo_tamano: string
  densidad: string
  instagram: string | null
  linkedin: string | null
  created_at: string
  updated_at: string
}

export interface Caracteristica {
  icono: string
  titulo: string
  descripcion: string
}

export interface Item {
  id: string
  propuesta_id: string
  nombre: string
  descripcion: string | null
  precio: number
  moneda: Moneda
  orden: number
  aceptado: boolean
  caracteristicas: Caracteristica[]
}

export interface Bloque {
  id: string
  user_id: string
  nombre: string
  descripcion: string | null
  precio: number
  moneda: Moneda
  veces_usado: number
  caracteristicas: Caracteristica[]
  created_at: string
  updated_at: string
}

export interface Propuesta {
  id: string
  user_id: string
  slug: string
  titulo: string
  cliente_nombre: string
  cliente_empresa: string | null
  cliente_email: string | null
  cliente_telefono: string | null
  cliente_documento: string | null
  introduccion: string | null
  terminos: string | null
  moneda: Moneda
  tipo_cambio: number | null
  vigencia_dias: number
  estado: Estado
  modo_aceptacion: ModoAceptacion
  motivo_rechazo: string | null
  enviada_at: string | null
  vista_primera_vez_at: string | null
  aceptada_at: string | null
  rechazada_at: string | null
  created_at: string
  updated_at: string
  items?: Item[]
}

export interface PropuestaConVisitas extends Propuesta {
  visitas: { created_at: string }[]
}

export type FacturaEstado = 'pendiente' | 'facturada' | 'enviada' | 'error'

export interface Rubro {
  id: string
  nombre: string
  slug: string
  orden: number
  created_at: string
}

export interface Servicio {
  id: string
  rubro_id: string
  nombre: string
  slug: string
  orden: number
  created_at: string
}

/** Forma mínima para insertar un bloque (de biblioteca o de ejemplo). */
export type BloqueInsertable = Pick<
  Bloque,
  'nombre' | 'descripcion' | 'precio' | 'moneda' | 'caracteristicas'
>

export interface PlantillaItem {
  nombre: string
  descripcion: string | null
  precio: number
  moneda: Moneda
  caracteristicas: Caracteristica[]
}

export interface Plantilla {
  id: string
  rubro_id: string
  nombre: string
  descripcion: string | null
  introduccion: string | null
  terminos: string | null
  moneda: Moneda
  vigencia_dias: number
  modo_aceptacion: ModoAceptacion
  items: PlantillaItem[]
  orden: number
  created_at: string
}

export interface BloqueEjemplo {
  id: string
  servicio_id: string
  nombre: string
  descripcion: string | null
  precio: number
  moneda: Moneda
  caracteristicas: Caracteristica[]
  orden: number
  created_at: string
}

export interface Pago {
  id: string
  propuesta_id: string
  user_id: string
  numero: number
  monto: number
  moneda: Moneda
  vencimiento: string
  pagado: boolean
  pagado_at: string | null
  factura_estado: FacturaEstado
  factura_numero: string | null
  factura_cae: string | null
  factura_url: string | null
  facturado_at: string | null
  created_at: string
}
