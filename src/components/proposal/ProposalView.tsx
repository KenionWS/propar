import type { ReactNode } from 'react'
import type { Profile, Propuesta, Item } from '@/lib/types'
import {
  formatMoney,
  totalesPorMoneda,
  itemsIncluidos,
  formatFechaLarga,
  fechaVencimiento,
  isVencida,
} from '@/lib/formatters'
import {
  fuenteStack,
  logoPx,
  densidadEspaciado,
} from '@/lib/branding'
import { getIcono } from '@/lib/iconos'
import { AtSign, Link2, Globe, Mail, Phone } from 'lucide-react'

export function ProposalView({
  propuesta,
  items,
  profile,
  actionSlot,
  cuerpo,
}: {
  propuesta: Propuesta
  items: Item[]
  profile: Profile | null
  actionSlot?: ReactNode
  /** Reemplaza la sección de servicios+totales (para aceptación por bloques). */
  cuerpo?: ReactNode
}) {
  const color = profile?.color_primario || '#111827'
  const acento = profile?.color_acento || '#16a34a'
  const font = fuenteStack(profile?.fuente)
  const logoH = logoPx(profile?.logo_tamano)
  const esp = densidadEspaciado(profile?.densidad)
  const vencida = isVencida(propuesta)
  const aceptada =
    propuesta.estado === 'aceptada' || propuesta.estado === 'aceptada_parcial'
  // En estados cerrados solo cuentan los bloques incluidos (no rechazados).
  const itemsVisibles = items
  const totales = totalesPorMoneda(itemsIncluidos(items))

  return (
    <div
      className="mx-auto max-w-2xl px-5"
      style={{
        fontFamily: font,
        paddingTop: esp.pagePadding,
        paddingBottom: esp.pagePadding,
      }}
    >
      {/* Barra de acento superior */}
      <div
        className="mb-6 h-1 w-16 rounded-full"
        style={{ backgroundColor: acento }}
      />

      {/* Encabezado */}
      <div
        className="flex items-start justify-between gap-4"
        style={{ marginBottom: esp.blockGap }}
      >
        <div>
          {profile?.empresa_logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.empresa_logo_url}
              alt={profile.empresa_nombre || 'Logo'}
              className="w-auto object-contain"
              style={{ height: logoH }}
            />
          ) : (
            <span className="text-xl font-bold" style={{ color }}>
              {profile?.empresa_nombre || 'PropAR'}
            </span>
          )}
        </div>
        <span className="whitespace-nowrap pt-1 text-sm text-muted-foreground">
          {formatFechaLarga(new Date(propuesta.created_at))}
        </span>
      </div>

      {/* Banners de estado */}
      {aceptada ? (
        <div className="mb-8 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          ✓ Esta propuesta fue aceptada el{' '}
          {propuesta.aceptada_at
            ? new Date(propuesta.aceptada_at).toLocaleDateString('es-AR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })
            : ''}
          .
        </div>
      ) : vencida ? (
        <div className="mb-8 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Esta propuesta venció el {fechaVencimiento(propuesta)}. Contactanos para
          obtener una actualización.
        </div>
      ) : null}

      {/* Título */}
      <header style={{ marginBottom: esp.blockGap }}>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {propuesta.titulo}
        </h1>
        {propuesta.cliente_nombre ? (
          <p className="mt-2 text-muted-foreground">
            Preparada para:{' '}
            <span className="font-medium text-foreground">
              {propuesta.cliente_empresa || propuesta.cliente_nombre}
            </span>
          </p>
        ) : null}
      </header>

      {/* Introducción */}
      {propuesta.introduccion ? (
        <>
          <hr style={{ marginTop: esp.blockGap, marginBottom: esp.blockGap }} />
          <p className="whitespace-pre-line leading-relaxed text-foreground/90">
            {propuesta.introduccion}
          </p>
        </>
      ) : null}

      {/* Servicios */}
      {cuerpo ?? (
        <>
          <hr style={{ marginTop: esp.blockGap, marginBottom: esp.blockGap }} />
          <h2
            className="mb-4 text-xs font-semibold uppercase tracking-wider"
            style={{ color: acento }}
          >
            Servicios
          </h2>
          <div className="flex flex-col" style={{ gap: esp.itemGap }}>
            {itemsVisibles.map((item, idx) => {
              const excluido = item.aceptado === false
              const caracs = item.caracteristicas ?? []
              return (
                <div
                  key={item.id}
                  className={
                    excluido
                      ? 'rounded-xl border border-dashed p-4 opacity-60'
                      : 'rounded-xl border p-4'
                  }
                >
                  {/* Encabezado de la sección */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <span
                        className="mt-0.5 text-xs font-bold tabular-nums"
                        style={{ color: acento }}
                      >
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0">
                        <p
                          className={
                            excluido
                              ? 'font-semibold line-through'
                              : 'font-semibold'
                          }
                        >
                          {item.nombre}
                        </p>
                        {item.descripcion ? (
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {item.descripcion}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <p
                      className={
                        excluido
                          ? 'whitespace-nowrap font-bold line-through'
                          : 'whitespace-nowrap font-bold'
                      }
                      style={excluido ? undefined : { color: acento }}
                    >
                      {formatMoney(Number(item.precio), item.moneda)}
                    </p>
                  </div>

                  {/* Características incluidas */}
                  {caracs.length > 0 ? (
                    <div className="mt-3 space-y-2 border-t pt-3">
                      {caracs.map((c, ci) => {
                        const Icon = getIcono(c.icono)
                        return (
                          <div
                            key={ci}
                            className="flex items-start justify-between gap-3"
                          >
                            <div className="flex min-w-0 items-start gap-2.5">
                              <span
                                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                                style={{
                                  backgroundColor: `${acento}1a`,
                                  color: acento,
                                }}
                              >
                                <Icon className="h-3.5 w-3.5" />
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm font-medium">{c.titulo}</p>
                                {c.descripcion ? (
                                  <p className="text-xs text-muted-foreground">
                                    {c.descripcion}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              Incluido
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  ) : null}

                  {excluido ? (
                    <span className="mt-2 inline-block rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      No incluido
                    </span>
                  ) : null}
                </div>
              )
            })}
          </div>

          {/* Totales */}
          <div className="mt-6 flex flex-col items-end gap-1 border-t pt-4">
            {totales.ARS > 0 ? (
              <div className="flex w-full max-w-xs justify-between">
                <span className="text-sm text-muted-foreground">Total ARS</span>
                <span className="text-lg font-bold" style={{ color: acento }}>
                  {formatMoney(totales.ARS, 'ARS')}
                </span>
              </div>
            ) : null}
            {totales.USD > 0 ? (
              <div className="flex w-full max-w-xs justify-between">
                <span className="text-sm text-muted-foreground">Total USD</span>
                <span className="text-lg font-bold" style={{ color: acento }}>
                  {formatMoney(totales.USD, 'USD')}
                </span>
              </div>
            ) : null}
            {propuesta.moneda === 'USD' && propuesta.tipo_cambio ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Tipo de cambio referencia:{' '}
                {formatMoney(propuesta.tipo_cambio, 'ARS')} / USD (solo
                informativo)
              </p>
            ) : null}
          </div>
        </>
      )}

      {/* Términos */}
      {propuesta.terminos ? (
        <>
          <hr style={{ marginTop: esp.blockGap, marginBottom: esp.blockGap }} />
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Términos y condiciones
          </h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/80">
            {propuesta.terminos}
          </p>
        </>
      ) : null}

      {/* Vigencia */}
      {!aceptada && propuesta.enviada_at ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Este precio es válido hasta el{' '}
          <strong className="text-foreground">
            {fechaVencimiento(propuesta)}
          </strong>
          .
        </p>
      ) : null}

      {/* CTA */}
      {actionSlot ? <div className="mt-10">{actionSlot}</div> : null}

      {/* Footer */}
      <Footer profile={profile} />
    </div>
  )
}

function Footer({ profile }: { profile: Profile | null }) {
  if (!profile) return null
  const tieneRedes = profile.instagram || profile.linkedin
  const tieneContacto =
    profile.empresa_email || profile.empresa_telefono || profile.empresa_web
  if (!profile.empresa_nombre && !tieneContacto && !tieneRedes) return null

  return (
    <footer className="mt-16 border-t pt-6">
      <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span className="font-medium text-foreground">
          {profile.empresa_nombre}
        </span>
        <div className="flex flex-wrap items-center gap-4">
          {profile.empresa_email ? (
            <a
              href={`mailto:${profile.empresa_email}`}
              className="flex items-center gap-1 hover:text-foreground"
            >
              <Mail className="h-3.5 w-3.5" />
              {profile.empresa_email}
            </a>
          ) : null}
          {profile.empresa_telefono ? (
            <span className="flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" />
              {profile.empresa_telefono}
            </span>
          ) : null}
          {profile.empresa_web ? (
            <a
              href={profile.empresa_web}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-foreground"
            >
              <Globe className="h-3.5 w-3.5" />
              Web
            </a>
          ) : null}
          {profile.instagram ? (
            <a
              href={`https://instagram.com/${profile.instagram.replace('@', '')}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-foreground"
            >
              <AtSign className="h-3.5 w-3.5" />
              {profile.instagram}
            </a>
          ) : null}
          {profile.linkedin ? (
            <a
              href={profile.linkedin}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-foreground"
            >
              <Link2 className="h-3.5 w-3.5" />
              LinkedIn
            </a>
          ) : null}
        </div>
      </div>
    </footer>
  )
}
