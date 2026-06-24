import https from 'https'

/**
 * POST de un sobre SOAP por HTTPS, devolviendo el body como texto.
 * Usamos HTTPS crudo (en vez de descargar el WSDL) porque en redes con
 * intercepción TLS la descarga del WSDL falla. Si `AFIP_INSECURE_TLS=1`
 * no valida el certificado del servidor (solo para dev detrás de proxy).
 */
export function postSoap(
  url: string,
  body: string,
  soapAction = ''
): Promise<string> {
  const insecure = process.env.AFIP_INSECURE_TLS === '1'
  const u = new URL(url)
  const data = Buffer.from(body, 'utf8')

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: u.hostname,
        port: 443,
        path: u.pathname + u.search,
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'Content-Length': data.length,
          SOAPAction: soapAction,
        },
        rejectUnauthorized: !insecure,
      },
      (res) => {
        let chunks = ''
        res.setEncoding('utf8')
        res.on('data', (c) => (chunks += c))
        res.on('end', () => resolve(chunks))
      }
    )
    req.on('error', reject)
    req.write(data)
    req.end()
  })
}

/** Desescapa entidades XML básicas. */
export function unescapeXml(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
}

/** Extrae el contenido de la primera ocurrencia de un tag (sin namespace). */
export function pick(xml: string, tag: string): string | null {
  const m = xml.match(
    new RegExp(`<(?:\\w+:)?${tag}>([\\s\\S]*?)</(?:\\w+:)?${tag}>`)
  )
  return m ? m[1] : null
}
