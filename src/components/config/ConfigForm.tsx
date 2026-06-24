'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Upload, Mail, Phone, Globe, AtSign, Link2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FUENTES,
  LOGO_TAMANOS,
  DENSIDADES,
  fuenteStack,
} from '@/lib/branding'
import type { Profile } from '@/lib/types'

export function ConfigForm({
  userId,
  profile,
}: {
  userId: string
  profile: Profile
}) {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [form, setForm] = useState({
    empresa_nombre: profile.empresa_nombre ?? '',
    empresa_email: profile.empresa_email ?? '',
    empresa_telefono: profile.empresa_telefono ?? '',
    empresa_web: profile.empresa_web ?? '',
    empresa_direccion: profile.empresa_direccion ?? '',
    color_primario: profile.color_primario ?? '#111827',
    color_acento: profile.color_acento ?? '#16a34a',
    fuente: profile.fuente ?? 'Inter',
    logo_tamano: profile.logo_tamano ?? 'mediano',
    densidad: profile.densidad ?? 'normal',
    instagram: profile.instagram ?? '',
    linkedin: profile.linkedin ?? '',
    empresa_logo_url: profile.empresa_logo_url ?? '',
  })

  const patch = (p: Partial<typeof form>) => setForm((f) => ({ ...f, ...p }))

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${userId}/logo-${Date.now()}.${ext}`

    const { error } = await supabase.storage
      .from('logos')
      .upload(path, file, { upsert: true, cacheControl: '3600' })

    if (error) {
      setUploading(false)
      toast.error('Error al subir el logo: ' + error.message)
      return
    }

    const { data } = supabase.storage.from('logos').getPublicUrl(path)
    patch({ empresa_logo_url: data.publicUrl })
    setUploading(false)
    toast.success('Logo subido. No olvides guardar los cambios.')
  }

  async function save() {
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        empresa_nombre: form.empresa_nombre,
        empresa_email: form.empresa_email || null,
        empresa_telefono: form.empresa_telefono || null,
        empresa_web: form.empresa_web || null,
        empresa_direccion: form.empresa_direccion || null,
        color_primario: form.color_primario,
        color_acento: form.color_acento,
        fuente: form.fuente,
        logo_tamano: form.logo_tamano,
        densidad: form.densidad,
        instagram: form.instagram || null,
        linkedin: form.linkedin || null,
        empresa_logo_url: form.empresa_logo_url || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    setSaving(false)
    if (error) {
      toast.error('Error al guardar: ' + error.message)
      return
    }
    toast.success('Configuración guardada.')
    router.refresh()
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Identidad de la agencia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Logo</Label>
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border bg-muted/40">
                  {form.empresa_logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.empresa_logo_url}
                      alt="Logo"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    onClick={() => document.getElementById('logo')?.click()}
                    className="gap-2"
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    Subir logo
                  </Button>
                  <p className="mt-1 text-xs text-muted-foreground">
                    PNG o JPG, fondo transparente recomendado.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="empresa_nombre">Nombre de la empresa</Label>
              <Input
                id="empresa_nombre"
                value={form.empresa_nombre}
                onChange={(e) => patch({ empresa_nombre: e.target.value })}
                placeholder="Kenion"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="color">Color primario</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.color_primario}
                    onChange={(e) => patch({ color_primario: e.target.value })}
                    className="h-10 w-12 cursor-pointer rounded border bg-background p-1"
                  />
                  <Input
                    value={form.color_primario}
                    onChange={(e) => patch({ color_primario: e.target.value })}
                    className="w-32 font-mono"
                    placeholder="#111827"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Marca, títulos y nombre de la empresa.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="acento">Color de acento</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.color_acento}
                    onChange={(e) => patch({ color_acento: e.target.value })}
                    className="h-10 w-12 cursor-pointer rounded border bg-background p-1"
                  />
                  <Input
                    value={form.color_acento}
                    onChange={(e) => patch({ color_acento: e.target.value })}
                    className="w-32 font-mono"
                    placeholder="#16a34a"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Botón de aceptar, totales y detalles.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Estilo de las propuestas</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Tipografía</Label>
              <Select
                value={form.fuente}
                onValueChange={(v) => patch({ fuente: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FUENTES.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tamaño del logo</Label>
              <Select
                value={form.logo_tamano}
                onValueChange={(v) => patch({ logo_tamano: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOGO_TAMANOS.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Densidad</Label>
              <Select
                value={form.densidad}
                onValueChange={(v) => patch({ densidad: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DENSIDADES.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contacto</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="empresa_email">Email de contacto</Label>
              <Input
                id="empresa_email"
                type="email"
                value={form.empresa_email}
                onChange={(e) => patch({ empresa_email: e.target.value })}
                placeholder="hola@kenion.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="empresa_telefono">Teléfono</Label>
              <Input
                id="empresa_telefono"
                value={form.empresa_telefono}
                onChange={(e) => patch({ empresa_telefono: e.target.value })}
                placeholder="+54 9 11 1234 5678"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="empresa_web">Sitio web</Label>
              <Input
                id="empresa_web"
                value={form.empresa_web}
                onChange={(e) => patch({ empresa_web: e.target.value })}
                placeholder="https://kenion.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="empresa_direccion">Dirección</Label>
              <Input
                id="empresa_direccion"
                value={form.empresa_direccion}
                onChange={(e) => patch({ empresa_direccion: e.target.value })}
                placeholder="Av. Siempre Viva 123, CABA"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={form.instagram}
                onChange={(e) => patch({ instagram: e.target.value })}
                placeholder="@kenion"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="linkedin">LinkedIn (URL)</Label>
              <Input
                id="linkedin"
                value={form.linkedin}
                onChange={(e) => patch({ linkedin: e.target.value })}
                placeholder="https://linkedin.com/company/kenion"
              />
            </div>
          </CardContent>
        </Card>

        <Button onClick={save} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Guardar cambios
        </Button>
      </div>

      {/* Preview en vivo */}
      <div className="lg:col-span-1">
        <Card className="sticky top-8">
          <CardHeader>
            <CardTitle className="text-base">Vista previa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mini propuesta */}
            <div
              className="rounded-lg border bg-white p-4"
              style={{ fontFamily: fuenteStack(form.fuente) }}
            >
              <div
                className="mb-3 h-1 w-10 rounded-full"
                style={{ backgroundColor: form.color_acento }}
              />
              {form.empresa_logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.empresa_logo_url}
                  alt="Logo"
                  className="w-auto object-contain"
                  style={{
                    height:
                      LOGO_TAMANOS.find((l) => l.value === form.logo_tamano)
                        ?.px ?? 48,
                  }}
                />
              ) : (
                <span
                  className="text-lg font-bold"
                  style={{ color: form.color_primario }}
                >
                  {form.empresa_nombre || 'Tu agencia'}
                </span>
              )}
              <p className="mt-3 text-sm font-bold">Propuesta de ejemplo</p>
              <p
                className="mt-3 text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: form.color_acento }}
              >
                Servicios
              </p>
              <div className="mt-1 flex justify-between text-xs">
                <span>Servicio de ejemplo</span>
                <span className="font-semibold" style={{ color: form.color_acento }}>
                  $100.000
                </span>
              </div>
              <button
                type="button"
                className="mt-4 w-full rounded-md py-2 text-xs font-medium text-white"
                style={{ backgroundColor: form.color_acento }}
              >
                Aceptar propuesta
              </button>
            </div>

            {/* Footer */}
            <div className="rounded-lg border bg-white p-4">
              <p className="mb-2 text-xs font-medium text-foreground">
                {form.empresa_nombre || 'Tu agencia'}
              </p>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                {form.empresa_email ? (
                  <p className="flex items-center gap-1.5">
                    <Mail className="h-3 w-3" /> {form.empresa_email}
                  </p>
                ) : null}
                {form.empresa_telefono ? (
                  <p className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3" /> {form.empresa_telefono}
                  </p>
                ) : null}
                {form.empresa_web ? (
                  <p className="flex items-center gap-1.5">
                    <Globe className="h-3 w-3" /> {form.empresa_web}
                  </p>
                ) : null}
                {form.instagram ? (
                  <p className="flex items-center gap-1.5">
                    <AtSign className="h-3 w-3" /> {form.instagram}
                  </p>
                ) : null}
                {form.linkedin ? (
                  <p className="flex items-center gap-1.5">
                    <Link2 className="h-3 w-3" /> LinkedIn
                  </p>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
