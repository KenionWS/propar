import { Resend } from 'resend'

const apiKey = process.env.RESEND_API_KEY
const fromEmail = process.env.RESEND_FROM_EMAIL || 'PropAR <onboarding@resend.dev>'

const resend = apiKey ? new Resend(apiKey) : null

interface SendArgs {
  to: string
  subject: string
  html: string
}

/**
 * Envía un email vía Resend. Si no hay API key configurada, lo loguea
 * y devuelve sin fallar (para no romper el flujo en desarrollo).
 */
export async function sendEmail({ to, subject, html }: SendArgs): Promise<void> {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY no configurada — email no enviado:', subject)
    return
  }
  if (!to) return
  try {
    await resend.emails.send({ from: fromEmail, to, subject, html })
  } catch (err) {
    console.error('[email] Error enviando email:', err)
  }
}

function wrapper(contenido: string): string {
  return `
  <div style="font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #111827;">
    <div style="padding: 24px 0; border-bottom: 1px solid #e5e7eb;">
      <span style="font-size: 20px; font-weight: 700;">PropAR</span>
    </div>
    <div style="padding: 24px 0; font-size: 15px; line-height: 1.6;">
      ${contenido}
    </div>
    <div style="padding: 16px 0; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
      Notificación automática de PropAR.
    </div>
  </div>`
}

export function emailPropuestaVista(args: {
  to: string
  titulo: string
  cliente: string
}): SendArgs {
  return {
    to: args.to,
    subject: `👀 ${args.cliente} abrió tu propuesta "${args.titulo}"`,
    html: wrapper(
      `<p>Tu propuesta <strong>"${args.titulo}"</strong> fue abierta por <strong>${args.cliente}</strong> hace un momento.</p>`
    ),
  }
}

export function emailFactura(args: {
  to: string
  cliente: string
  empresa: string
  numero: string
  monto: string
  url?: string | null
}): SendArgs {
  return {
    to: args.to,
    subject: `Factura ${args.numero} — ${args.empresa}`,
    html: wrapper(
      `<p>Hola ${args.cliente},</p>
       <p>Te enviamos la factura <strong>${args.numero}</strong> por <strong>${args.monto}</strong>.</p>
       ${
         args.url
           ? `<p><a href="${args.url}" style="color:#111827;font-weight:600;">Ver / descargar la factura</a></p>`
           : ''
       }
       <p>Gracias,<br/>${args.empresa}</p>`
    ),
  }
}

export function emailPropuestaAceptada(args: {
  to: string
  titulo: string
  cliente: string
  monto: string
  parcial?: boolean
  cantidadBloques?: string
}): SendArgs {
  if (args.parcial) {
    return {
      to: args.to,
      subject: `🟡 ${args.cliente} aceptó parte de tu propuesta "${args.titulo}"`,
      html: wrapper(
        `<p><strong>${args.cliente}</strong> aceptó <strong>${
          args.cantidadBloques ?? 'algunos'
        } bloques</strong> de tu propuesta <strong>"${args.titulo}"</strong> por <strong>${
          args.monto
        }</strong>.</p>
         <p>Revisá la selección y confirmá la aceptación desde el editor de la propuesta.</p>`
      ),
    }
  }
  return {
    to: args.to,
    subject: `🎉 ${args.cliente} aceptó tu propuesta "${args.titulo}"`,
    html: wrapper(
      `<p>¡Buenas noticias! <strong>${args.cliente}</strong> aceptó tu propuesta <strong>"${args.titulo}"</strong> por <strong>${args.monto}</strong>.</p>
       <p>Es momento de contactarlo para avanzar.</p>`
    ),
  }
}
