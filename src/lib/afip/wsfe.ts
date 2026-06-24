import { postSoap, pick } from './soap'
import { CBTE_FACTURA_C } from '@/lib/afip'
import type { AfipAuth } from './wsaa'

const WSFE_ENDPOINT = {
  homologacion: 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx',
  produccion: 'https://servicios1.afip.gov.ar/wsfev1/service.asmx',
}
const NS = 'http://ar.gov.afip.dif.FEV1/'

function entorno(): 'homologacion' | 'produccion' {
  return process.env.AFIP_ENV === 'produccion' ? 'produccion' : 'homologacion'
}

function authXml(auth: AfipAuth): string {
  return `<ar:Auth><ar:Token>${auth.token}</ar:Token><ar:Sign>${auth.sign}</ar:Sign><ar:Cuit>${auth.cuit}</ar:Cuit></ar:Auth>`
}

function envelope(inner: string): string {
  return `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ar="${NS}"><soapenv:Header/><soapenv:Body>${inner}</soapenv:Body></soapenv:Envelope>`
}

/** Último número de comprobante autorizado para un punto de venta + tipo. */
export async function ultimoComprobante(
  auth: AfipAuth,
  ptoVta: number,
  cbteTipo: number
): Promise<number> {
  const inner = `<ar:FECompUltimoAutorizado>${authXml(
    auth
  )}<ar:PtoVta>${ptoVta}</ar:PtoVta><ar:CbteTipo>${cbteTipo}</ar:CbteTipo></ar:FECompUltimoAutorizado>`

  const resp = await postSoap(
    WSFE_ENDPOINT[entorno()],
    envelope(inner),
    NS + 'FECompUltimoAutorizado'
  )

  const err = pick(resp, 'Errors')
  if (err) {
    console.error('[afip][wsfe] FECompUltimoAutorizado:\n', resp)
    const msg = pick(err, 'Msg') || 'Error consultando último comprobante'
    throw new Error('AFIP WSFE: ' + msg)
  }
  const fault = pick(resp, 'faultstring')
  if (fault) {
    console.error('[afip][wsfe] fault:\n', resp)
    throw new Error('AFIP WSFE: ' + fault)
  }
  const nro = pick(resp, 'CbteNro')
  return nro ? parseInt(nro, 10) : 0
}

export interface SolicitarCaeArgs {
  ptoVta: number
  cbteTipo: number
  numero: number
  fecha: string // YYYYMMDD
  docTipo: number // 99 = consumidor final
  docNro: number
  importe: number
  conceptoServicios?: boolean
}

export interface CaeResult {
  resultado: 'A' | 'R' | string
  cae?: string
  caeVto?: string
  observaciones?: string
  errores?: string
}

/** Solicita el CAE para un comprobante (Factura C monotributo, sin IVA). */
export async function solicitarCae(
  auth: AfipAuth,
  a: SolicitarCaeArgs
): Promise<CaeResult> {
  const imp = a.importe.toFixed(2)
  const servicios = a.conceptoServicios ?? true
  const concepto = servicios ? 2 : 1

  const fechasServicio = servicios
    ? `<ar:FchServDesde>${a.fecha}</ar:FchServDesde><ar:FchServHasta>${a.fecha}</ar:FchServHasta><ar:FchVtoPago>${a.fecha}</ar:FchVtoPago>`
    : ''

  const detalle = `<ar:FECAEDetRequest>
<ar:Concepto>${concepto}</ar:Concepto>
<ar:DocTipo>${a.docTipo}</ar:DocTipo>
<ar:DocNro>${a.docNro}</ar:DocNro>
<ar:CbteDesde>${a.numero}</ar:CbteDesde>
<ar:CbteHasta>${a.numero}</ar:CbteHasta>
<ar:CbteFch>${a.fecha}</ar:CbteFch>
<ar:ImpTotal>${imp}</ar:ImpTotal>
<ar:ImpTotConc>0.00</ar:ImpTotConc>
<ar:ImpNeto>${imp}</ar:ImpNeto>
<ar:ImpOpEx>0.00</ar:ImpOpEx>
<ar:ImpTrib>0.00</ar:ImpTrib>
<ar:ImpIVA>0.00</ar:ImpIVA>
${fechasServicio}
<ar:MonId>PES</ar:MonId>
<ar:MonCotiz>1</ar:MonCotiz>
</ar:FECAEDetRequest>`

  const inner = `<ar:FECAESolicitar>${authXml(auth)}<ar:FeCAEReq>
<ar:FeCabReq><ar:CantReg>1</ar:CantReg><ar:PtoVta>${a.ptoVta}</ar:PtoVta><ar:CbteTipo>${a.cbteTipo}</ar:CbteTipo></ar:FeCabReq>
<ar:FeDetReq>${detalle}</ar:FeDetReq>
</ar:FeCAEReq></ar:FECAESolicitar>`

  const resp = await postSoap(
    WSFE_ENDPOINT[entorno()],
    envelope(inner),
    NS + 'FECAESolicitar'
  )

  // Errores a nivel request
  const errBlock = pick(resp, 'Errors')
  const errores = errBlock
    ? (pick(errBlock, 'Msg') ?? 'Error de AFIP')
    : undefined

  const resultado = pick(resp, 'Resultado') ?? 'R'
  const cae = pick(resp, 'CAE') ?? undefined
  const caeVto = pick(resp, 'CAEFchVto') ?? undefined

  const obsBlock = pick(resp, 'Observaciones')
  const observaciones = obsBlock ? (pick(obsBlock, 'Msg') ?? undefined) : undefined

  if (resultado !== 'A' || !cae) {
    console.error('[afip][wsfe] FECAESolicitar (rechazo):\n', resp)
  }

  return { resultado, cae: cae || undefined, caeVto, observaciones, errores }
}

export { CBTE_FACTURA_C }
