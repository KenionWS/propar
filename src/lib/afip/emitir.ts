import {
  afipConfig,
  afipConfigurado,
  documentoReceptor,
  CBTE_FACTURA_C,
  type DatosFactura,
  type ResultadoFactura,
} from '@/lib/afip'
import { getAuth } from './wsaa'
import { ultimoComprobante, solicitarCae } from './wsfe'

function hoyYyyyMmDd(): string {
  const d = new Date()
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(
    d.getDate()
  ).padStart(2, '0')}`
}

/**
 * Emite una Factura C (monotributo) contra AFIP WSFEv1 y devuelve el CAE.
 * Receptor: Consumidor Final (DocTipo 99). Solo ARS.
 */
export async function generarFactura(
  datos: DatosFactura
): Promise<ResultadoFactura> {
  if (!afipConfigurado()) {
    return {
      ok: false,
      error:
        'La facturación con AFIP todavía no está configurada (falta CUIT y certificado).',
    }
  }
  if (datos.moneda !== 'ARS') {
    return {
      ok: false,
      error: 'Por ahora solo se puede facturar en ARS.',
    }
  }

  const { puntoVenta } = afipConfig()
  const cbteTipo = CBTE_FACTURA_C

  try {
    const auth = await getAuth('wsfe')
    const ultimo = await ultimoComprobante(auth, puntoVenta, cbteTipo)
    const numero = ultimo + 1

    // Receptor: si hay documento cargado, se factura a ese CUIT/DNI;
    // si no, Consumidor Final.
    const { docTipo, docNro } = documentoReceptor(datos.cliente.documento)

    const res = await solicitarCae(auth, {
      ptoVta: puntoVenta,
      cbteTipo,
      numero,
      fecha: hoyYyyyMmDd(),
      docTipo,
      docNro,
      importe: Number(datos.monto),
      conceptoServicios: true,
    })

    if (res.resultado !== 'A' || !res.cae) {
      const motivo = res.errores || res.observaciones || 'Rechazado por AFIP'
      return { ok: false, error: motivo }
    }

    return {
      ok: true,
      numero: String(numero),
      cae: res.cae,
    }
  } catch (e) {
    console.error('[afip][emitir] excepción:', e)
    return { ok: false, error: (e as Error).message }
  }
}
