import React from 'react'
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from '@react-pdf/renderer'
import type { Propuesta, Item, Profile } from '@/lib/types'
import {
  formatMoney,
  totalesPorMoneda,
  itemsIncluidos,
  formatFechaLarga,
  fechaVencimiento,
} from '@/lib/formatters'
import { fuentePdf, logoPx, densidadEspaciado } from '@/lib/branding'

export function ProposalPDF({
  propuesta,
  items,
  profile,
}: {
  propuesta: Propuesta
  items: Item[]
  profile: Profile | null
}) {
  const color = profile?.color_primario || '#111827'
  const acento = profile?.color_acento || '#16a34a'
  const pdfFont = fuentePdf(profile?.fuente)
  const logoH = logoPx(profile?.logo_tamano)
  const esp = densidadEspaciado(profile?.densidad)
  // En propuestas con aceptación parcial, el PDF muestra solo lo incluido.
  const incluidos = itemsIncluidos(items)
  const totales = totalesPorMoneda(incluidos)

  const styles = StyleSheet.create({
    page: {
      paddingTop: esp.pagePadding,
      paddingBottom: esp.pagePadding + 16,
      paddingHorizontal: 48,
      fontSize: 10,
      fontFamily: pdfFont.base,
      color: '#1f2937',
      lineHeight: 1.5,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 28,
    },
    logo: { height: logoH, objectFit: 'contain' },
    empresaNombre: { fontSize: 16, fontFamily: pdfFont.bold, color },
    fecha: { fontSize: 9, color: '#6b7280' },
    titulo: { fontSize: 20, fontFamily: pdfFont.bold, marginBottom: 4 },
    cliente: { fontSize: 11, color: '#4b5563', marginBottom: 16 },
    clienteStrong: { fontFamily: pdfFont.bold, color: '#1f2937' },
    sep: {
      borderBottomWidth: 1,
      borderBottomColor: '#e5e7eb',
      marginVertical: esp.blockGap,
    },
    intro: { color: '#374151', marginBottom: 4 },
    sectionLabel: {
      fontSize: 9,
      fontFamily: pdfFont.bold,
      textTransform: 'uppercase',
      letterSpacing: 1,
      color: acento,
      marginBottom: 10,
    },
    item: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: esp.itemGap,
      borderBottomWidth: 1,
      borderBottomColor: '#f3f4f6',
      paddingBottom: esp.itemGap,
    },
    itemNombre: { fontFamily: pdfFont.bold },
    itemDesc: { fontSize: 9, color: '#6b7280', marginTop: 2 },
    itemPrecio: { fontFamily: pdfFont.bold },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 8,
    },
    totalBox: { width: 200, flexDirection: 'row', justifyContent: 'space-between' },
    totalLabel: { color: '#6b7280' },
    totalValue: { fontSize: 13, fontFamily: pdfFont.bold, color: acento },
    terminosLabel: {
      fontSize: 9,
      fontFamily: pdfFont.bold,
      textTransform: 'uppercase',
      letterSpacing: 1,
      color: '#6b7280',
      marginBottom: 6,
    },
    terminos: { fontSize: 9, color: '#4b5563' },
    vigencia: { marginTop: 14, fontSize: 10, color: '#374151' },
    footer: {
      position: 'absolute',
      bottom: 24,
      left: 48,
      right: 48,
      borderTopWidth: 1,
      borderTopColor: '#e5e7eb',
      paddingTop: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
      fontSize: 8,
      color: '#9ca3af',
    },
  })

  const contactoFooter = [
    profile?.empresa_email,
    profile?.empresa_telefono,
    profile?.empresa_web,
  ]
    .filter(Boolean)
    .join('  ·  ')

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {profile?.empresa_logo_url ? (
            <Image src={profile.empresa_logo_url} style={styles.logo} />
          ) : (
            <Text style={styles.empresaNombre}>
              {profile?.empresa_nombre || 'PropAR'}
            </Text>
          )}
          <Text style={styles.fecha}>
            {formatFechaLarga(new Date(propuesta.created_at))}
          </Text>
        </View>

        {/* Título */}
        <Text style={styles.titulo}>{propuesta.titulo}</Text>
        {propuesta.cliente_nombre ? (
          <Text style={styles.cliente}>
            Preparada para:{' '}
            <Text style={styles.clienteStrong}>
              {propuesta.cliente_empresa || propuesta.cliente_nombre}
            </Text>
          </Text>
        ) : null}

        {/* Introducción */}
        {propuesta.introduccion ? (
          <>
            <View style={styles.sep} />
            <Text style={styles.intro}>{propuesta.introduccion}</Text>
          </>
        ) : null}

        <View style={styles.sep} />

        {/* Servicios */}
        <Text style={styles.sectionLabel}>Servicios</Text>
        {incluidos.map((item) => (
          <View key={item.id} style={styles.item}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.itemNombre}>{item.nombre}</Text>
              {item.descripcion ? (
                <Text style={styles.itemDesc}>{item.descripcion}</Text>
              ) : null}
            </View>
            <Text style={styles.itemPrecio}>
              {formatMoney(Number(item.precio), item.moneda)}
            </Text>
          </View>
        ))}

        {/* Totales */}
        {totales.ARS > 0 ? (
          <View style={styles.totalRow}>
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Total ARS</Text>
              <Text style={styles.totalValue}>
                {formatMoney(totales.ARS, 'ARS')}
              </Text>
            </View>
          </View>
        ) : null}
        {totales.USD > 0 ? (
          <View style={styles.totalRow}>
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Total USD</Text>
              <Text style={styles.totalValue}>
                {formatMoney(totales.USD, 'USD')}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Términos */}
        {propuesta.terminos ? (
          <>
            <View style={styles.sep} />
            <Text style={styles.terminosLabel}>Términos y condiciones</Text>
            <Text style={styles.terminos}>{propuesta.terminos}</Text>
          </>
        ) : null}

        {/* Vigencia */}
        {propuesta.enviada_at ? (
          <Text style={styles.vigencia}>
            Este precio es válido hasta el {fechaVencimiento(propuesta)}.
          </Text>
        ) : null}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>{profile?.empresa_nombre || ''}</Text>
          <Text>{contactoFooter}</Text>
        </View>
      </Page>
    </Document>
  )
}
