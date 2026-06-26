import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from '@react-pdf/renderer'
import { formatMoney } from '@/lib/formatters'
import { formatNroComprobante, labelDocumento } from '@/lib/afip'
import type { Pago, Propuesta, Profile } from '@/lib/types'

const s = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingHorizontal: 36,
    paddingBottom: 40,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#1f2937',
  },
  borrador: {
    position: 'absolute',
    top: 320,
    left: 90,
    fontSize: 60,
    color: '#f3f4f6',
    fontFamily: 'Helvetica-Bold',
    transform: 'rotate(-25deg)',
  },
  topRow: { flexDirection: 'row', borderWidth: 1, borderColor: '#9ca3af' },
  topCol: { flex: 1, padding: 10 },
  letraBox: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#9ca3af',
  },
  letra: { fontSize: 28, fontFamily: 'Helvetica-Bold' },
  letraCod: { fontSize: 7, color: '#6b7280' },
  empresa: { fontSize: 14, fontFamily: 'Helvetica-Bold', marginBottom: 6 },
  facturaTitulo: { fontSize: 16, fontFamily: 'Helvetica-Bold' },
  small: { fontSize: 8, color: '#374151', marginBottom: 2 },
  bold: { fontFamily: 'Helvetica-Bold' },
  section: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#9ca3af',
    padding: 8,
  },
  tableHead: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#9ca3af',
    marginTop: 10,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  row: {
    flexDirection: 'row',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#9ca3af',
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  colDesc: { flex: 1 },
  colImporte: { width: 90, textAlign: 'right' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  totalBox: { width: 200, flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontFamily: 'Helvetica-Bold' },
  totalValue: { fontSize: 12, fontFamily: 'Helvetica-Bold' },
  footer: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  qr: { width: 90, height: 90 },
  caeBox: { alignItems: 'flex-end' },
})

export function FacturaPDF({
  pago,
  propuesta,
  profile,
  cuit,
  puntoVenta,
  qrDataUrl,
  borrador,
}: {
  pago: Pago
  propuesta: Propuesta
  profile: Profile | null
  cuit: string
  puntoVenta: number
  qrDataUrl: string | null
  borrador: boolean
}) {
  const numero = Number(pago.factura_numero) || 0
  const fecha = pago.facturado_at
    ? new Date(pago.facturado_at)
    : new Date()
  const fechaStr = fecha.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const importe = Number(pago.monto)

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {borrador ? <Text style={s.borrador}>BORRADOR</Text> : null}

        {/* Encabezado */}
        <View style={s.topRow}>
          <View style={s.topCol}>
            <Text style={s.empresa}>{profile?.empresa_nombre || 'Cotizia'}</Text>
            <Text style={s.small}>CUIT: {cuit || '—'}</Text>
            <Text style={s.small}>Responsable Monotributo</Text>
            {profile?.empresa_direccion ? (
              <Text style={s.small}>{profile.empresa_direccion}</Text>
            ) : null}
          </View>
          <View style={s.letraBox}>
            <Text style={s.letra}>C</Text>
            <Text style={s.letraCod}>COD. 11</Text>
          </View>
          <View style={s.topCol}>
            <Text style={s.facturaTitulo}>FACTURA</Text>
            <Text style={[s.small, s.bold]}>
              N° {formatNroComprobante(puntoVenta, numero)}
            </Text>
            <Text style={s.small}>Fecha: {fechaStr}</Text>
          </View>
        </View>

        {/* Receptor */}
        <View style={s.section}>
          <Text style={s.small}>
            <Text style={s.bold}>Cliente: </Text>
            {propuesta.cliente_empresa || propuesta.cliente_nombre}
          </Text>
          <Text style={s.small}>
            <Text style={s.bold}>Identificación: </Text>
            {labelDocumento(propuesta.cliente_documento)}
          </Text>
          {propuesta.cliente_email ? (
            <Text style={s.small}>Email: {propuesta.cliente_email}</Text>
          ) : null}
        </View>

        {/* Detalle */}
        <View style={s.tableHead}>
          <Text style={[s.colDesc, s.bold]}>Descripción</Text>
          <Text style={[s.colImporte, s.bold]}>Importe</Text>
        </View>
        <View style={s.row}>
          <Text style={s.colDesc}>
            {propuesta.titulo || 'Servicios profesionales'}
            {pago.numero ? ` — Cuota ${pago.numero}` : ''}
          </Text>
          <Text style={s.colImporte}>{formatMoney(importe, pago.moneda)}</Text>
        </View>

        {/* Total */}
        <View style={s.totalRow}>
          <View style={s.totalBox}>
            <Text style={s.totalLabel}>Total</Text>
            <Text style={s.totalValue}>{formatMoney(importe, pago.moneda)}</Text>
          </View>
        </View>

        {/* QR + CAE */}
        <View style={s.footer}>
          {qrDataUrl ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={qrDataUrl} style={s.qr} />
          ) : (
            <View style={[s.qr, { borderWidth: 1, borderColor: '#d1d5db' }]}>
              <Text style={{ margin: 'auto', fontSize: 7, color: '#9ca3af' }}>
                QR al emitir
              </Text>
            </View>
          )}
          <View style={s.caeBox}>
            {pago.factura_cae ? (
              <>
                <Text style={s.small}>
                  <Text style={s.bold}>CAE: </Text>
                  {pago.factura_cae}
                </Text>
                <Text style={s.small}>Comprobante autorizado por AFIP</Text>
              </>
            ) : (
              <Text style={[s.small, { color: '#b91c1c' }]}>
                Documento no válido como factura (sin CAE).
              </Text>
            )}
          </View>
        </View>
      </Page>
    </Document>
  )
}
