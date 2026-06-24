import forge from 'node-forge'
import { createServiceClient } from '@/lib/supabase/server'
import { postSoap, unescapeXml, pick } from './soap'

const LOGIN_ENDPOINT = {
  homologacion: 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms',
  produccion: 'https://wsaa.afip.gov.ar/ws/services/LoginCms',
}

export interface AfipAuth {
  token: string
  sign: string
  cuit: string
}

function entorno(): 'homologacion' | 'produccion' {
  return process.env.AFIP_ENV === 'produccion' ? 'produccion' : 'homologacion'
}

function certPem(): string {
  return Buffer.from(process.env.AFIP_CERT || '', 'base64').toString('utf8')
}
function keyPem(): string {
  return Buffer.from(process.env.AFIP_KEY || '', 'base64').toString('utf8')
}

/** Arma el Ticket de Requerimiento de Acceso (TRA). */
function buildTra(service: string): string {
  const now = Date.now()
  const gen = new Date(now - 10 * 60 * 1000)
  const exp = new Date(now + 10 * 60 * 1000)
  const iso = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, 'Z')
  return `<?xml version="1.0" encoding="UTF-8"?>
<loginTicketRequest version="1.0">
<header>
<uniqueId>${Math.floor(now / 1000)}</uniqueId>
<generationTime>${iso(gen)}</generationTime>
<expirationTime>${iso(exp)}</expirationTime>
</header>
<service>${service}</service>
</loginTicketRequest>`
}

/** Firma el TRA en formato CMS/PKCS#7 (base64 DER). */
function signTra(tra: string): string {
  const cert = forge.pki.certificateFromPem(certPem())
  const key = forge.pki.privateKeyFromPem(keyPem())
  const p7 = forge.pkcs7.createSignedData()
  p7.content = forge.util.createBuffer(tra, 'utf8')
  p7.addCertificate(cert)
  p7.addSigner({
    key,
    certificate: cert,
    digestAlgorithm: forge.pki.oids.sha256,
    authenticatedAttributes: [
      { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
      { type: forge.pki.oids.messageDigest },
      { type: forge.pki.oids.signingTime, value: new Date().toString() },
    ],
  })
  p7.sign()
  const der = forge.asn1.toDer(p7.toAsn1()).getBytes()
  return forge.util.encode64(der)
}

/**
 * Devuelve token+sign vigentes para el servicio (default wsfe), usando el
 * cache de DB y pidiendo uno nuevo a WSAA si venció.
 */
export async function getAuth(service = 'wsfe'): Promise<AfipAuth> {
  const cuit = process.env.AFIP_CUIT || ''
  const supabase = createServiceClient()

  const { data: cache } = await supabase
    .from('afip_tokens')
    .select('*')
    .eq('service', service)
    .single()

  // margen de 5 min antes del vencimiento
  if (cache && new Date(cache.expira_at).getTime() > Date.now() + 5 * 60 * 1000) {
    return { token: cache.token, sign: cache.sign, cuit }
  }

  const cms = signTra(buildTra(service))
  const envelope = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wsaa="http://wsaa.view.sua.dvadac.desein.afip.gov"><soapenv:Header/><soapenv:Body><wsaa:loginCms><wsaa:in0>${cms}</wsaa:in0></wsaa:loginCms></soapenv:Body></soapenv:Envelope>`

  let resp: string
  try {
    resp = await postSoap(LOGIN_ENDPOINT[entorno()], envelope)
  } catch (e) {
    console.error('[afip][wsaa] error de red/TLS:', e)
    throw new Error('AFIP WSAA (red/TLS): ' + (e as Error).message)
  }

  const ret = pick(resp, 'loginCmsReturn')
  if (!ret) {
    console.error('[afip][wsaa] respuesta cruda:\n', resp)
    const fault = pick(resp, 'faultstring') || 'WSAA no devolvió un ticket'
    throw new Error('AFIP WSAA: ' + fault)
  }

  const ticket = unescapeXml(ret)
  const token = pick(ticket, 'token')
  const sign = pick(ticket, 'sign')
  const expira = pick(ticket, 'expirationTime')
  if (!token || !sign) {
    throw new Error('AFIP WSAA: respuesta sin token/sign')
  }

  await supabase.from('afip_tokens').upsert({
    service,
    token,
    sign,
    expira_at: expira ?? new Date(Date.now() + 11 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  })

  return { token, sign, cuit }
}
