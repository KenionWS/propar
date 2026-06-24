/**
 * Servicio de facturación electrónica (AFIP / ARCA).
 *
 * Esto es un STUB con la interfaz definida para integrar a futuro. Hoy NO
 * emite comprobantes reales. Cuando tengas los datos fiscales, implementá
 * `generarFactura` contra el WSFEv1 de AFIP:
 *
 *   1. Autenticar con WSAA usando certificado (.crt) + clave privada (.key)
 *      para obtener token + sign (válidos 12hs, conviene cachearlos).
 *   2. Pedir el último comprobante autorizado (FECompUltimoAutorizado).
 *   3. Emitir con FECAESolicitar (tipo de comprobante, punto de venta,
 *      importe, IVA, datos del receptor) y obtener el CAE.
 *   4. Devolver número de comprobante + CAE + (opcional) PDF.
 *
 * Config esperada en variables de entorno (todavía no seteadas):
 *   AFIP_CUIT, AFIP_PUNTO_VENTA, AFIP_CERT, AFIP_KEY, AFIP_ENV(homo|prod)
 */

/** Tipos de comprobante AFIP relevantes para monotributo. */
export const CBTE_FACTURA_C = 11
export const CBTE_NOTA_DEBITO_C = 12
export const CBTE_NOTA_CREDITO_C = 13

export interface AfipConfig {
  cuit: string
  puntoVenta: number
  env: 'homologacion' | 'produccion'
}

/** Config fiscal del emisor (monotributo) desde variables de entorno. */
export function afipConfig(): AfipConfig {
  return {
    cuit: process.env.AFIP_CUIT ?? '',
    puntoVenta: Number(process.env.AFIP_PUNTO_VENTA ?? '1'),
    env:
      process.env.AFIP_ENV === 'produccion' ? 'produccion' : 'homologacion',
  }
}

export interface QrData {
  fecha: string // YYYY-MM-DD
  cuit: string
  ptoVta: number
  tipoCmp: number
  nroCmp: number
  importe: number
  moneda: 'PES' | 'DOL'
  ctz: number
  tipoDocRec: number
  nroDocRec: number
  codAut: string // CAE
}

/**
 * Construye la URL del QR obligatorio de AFIP para un comprobante.
 * Spec: https://www.afip.gob.ar/fe/qr/
 */
export function buildQrUrl(d: QrData): string {
  const payload = {
    ver: 1,
    fecha: d.fecha,
    cuit: Number(d.cuit),
    ptoVta: d.ptoVta,
    tipoCmp: d.tipoCmp,
    nroCmp: d.nroCmp,
    importe: d.importe,
    moneda: d.moneda,
    ctz: d.ctz,
    tipoDocRec: d.tipoDocRec,
    nroDocRec: d.nroDocRec,
    tipoCodAut: 'E',
    codAut: Number(d.codAut),
  }
  const b64 = Buffer.from(JSON.stringify(payload)).toString('base64')
  return `https://www.afip.gob.ar/fe/qr/?p=${b64}`
}

/** Número de comprobante formateado: 00001-00000042 */
export function formatNroComprobante(ptoVta: number, numero: number): string {
  return `${String(ptoVta).padStart(5, '0')}-${String(numero).padStart(8, '0')}`
}

/**
 * Deriva el tipo y número de documento del receptor para AFIP a partir de
 * un texto libre (CUIT/CUIL/DNI). DocTipo: 80=CUIT, 96=DNI, 99=Cons. Final.
 * 11 dígitos → CUIT/CUIL (80); 7-8 dígitos → DNI (96); vacío/otro → CF (99).
 */
export function documentoReceptor(doc?: string | null): {
  docTipo: number
  docNro: number
} {
  const digits = (doc ?? '').replace(/\D/g, '')
  if (digits.length === 11) return { docTipo: 80, docNro: Number(digits) }
  if (digits.length === 7 || digits.length === 8)
    return { docTipo: 96, docNro: Number(digits) }
  return { docTipo: 99, docNro: 0 }
}

/** Etiqueta legible del documento para mostrar en la factura. */
export function labelDocumento(doc?: string | null): string {
  const { docTipo, docNro } = documentoReceptor(doc)
  if (docTipo === 80) return `CUIT ${docNro}`
  if (docTipo === 96) return `DNI ${docNro}`
  return 'Consumidor Final'
}

export interface DatosFactura {
  cliente: {
    nombre: string
    empresa: string | null
    email: string | null
    documento: string | null
  }
  concepto: string
  monto: number
  moneda: 'ARS' | 'USD'
}

export interface ResultadoFactura {
  ok: boolean
  numero?: string
  cae?: string
  url?: string
  error?: string
}

/** ¿Están las credenciales de AFIP configuradas? */
export function afipConfigurado(): boolean {
  return Boolean(
    process.env.AFIP_CUIT && process.env.AFIP_CERT && process.env.AFIP_KEY
  )
}

// La emisión real (generarFactura) vive en `src/lib/afip/emitir.ts` para
// no arrastrar las dependencias node-only (soap, node-forge) a este módulo,
// que también se usa al renderear el PDF.
