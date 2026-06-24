'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export interface ClienteData {
  cliente_nombre: string
  cliente_empresa: string
  cliente_email: string
  cliente_telefono: string
  cliente_documento: string
}

export function ClienteSection({
  data,
  onChange,
}: {
  data: ClienteData
  onChange: (patch: Partial<ClienteData>) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor="cliente_nombre">
          Nombre del cliente <span className="text-destructive">*</span>
        </Label>
        <Input
          id="cliente_nombre"
          value={data.cliente_nombre}
          onChange={(e) => onChange({ cliente_nombre: e.target.value })}
          placeholder="Juan Pérez"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cliente_empresa">Empresa</Label>
        <Input
          id="cliente_empresa"
          value={data.cliente_empresa}
          onChange={(e) => onChange({ cliente_empresa: e.target.value })}
          placeholder="Distribuidora Norte"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cliente_email">Email</Label>
        <Input
          id="cliente_email"
          type="email"
          value={data.cliente_email}
          onChange={(e) => onChange({ cliente_email: e.target.value })}
          placeholder="juan@empresa.com"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cliente_telefono">Teléfono</Label>
        <Input
          id="cliente_telefono"
          value={data.cliente_telefono}
          onChange={(e) => onChange({ cliente_telefono: e.target.value })}
          placeholder="+54 9 11 1234 5678"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cliente_documento">CUIT / CUIL / DNI</Label>
        <Input
          id="cliente_documento"
          value={data.cliente_documento}
          onChange={(e) => onChange({ cliente_documento: e.target.value })}
          placeholder="20-12345678-9 (opcional)"
        />
        <p className="text-xs text-muted-foreground">
          Para facturar. Si lo dejás vacío, se factura a Consumidor Final.
        </p>
      </div>
    </div>
  )
}
