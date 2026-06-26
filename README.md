# Cotizia

Aplicación web para crear y enviar propuestas comerciales profesionales.
El diferenciador es el workflow post-envío: link único por propuesta, tracking
de apertura en tiempo real, aceptación con un click y gestión de vigencia de precio.

Stack: **Next.js 14 (App Router) + TypeScript · Supabase · Tailwind + shadcn/ui ·
@react-pdf/renderer · Resend · Vercel**.

---

## Puesta en marcha

### 1. Crear el proyecto en Supabase

1. Creá un proyecto en [supabase.com](https://supabase.com).
2. Abrí el **SQL Editor** y ejecutá el contenido de
   [`supabase/schema.sql`](supabase/schema.sql). Eso crea las tablas
   (`profiles`, `propuestas`, `items`, `visitas`), las políticas RLS, el trigger
   que crea el perfil al registrarse y el bucket público `logos`.
3. En **Project Settings → API** copiá:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (¡secreto, nunca al cliente!)

### 2. Crear tu usuario

No hay registro público. Creá tu usuario manualmente en
**Authentication → Users → Add user** (con email y contraseña). El trigger crea
el perfil automáticamente.

### 3. Configurar Resend (notificaciones por email)

1. Creá una cuenta en [resend.com](https://resend.com) y generá un API key.
2. Ponelo en `RESEND_API_KEY`.
3. Para producción, verificá tu dominio y usá un `RESEND_FROM_EMAIL` con ese
   dominio. Para pruebas podés dejar `onboarding@resend.dev`.

> Si no configurás Resend, la app funciona igual: los emails simplemente se
> loguean en consola y no se envían.

### 4. Variables de entorno

Copiá `.env.example` a `.env.local` y completá los valores:

```bash
cp .env.example .env.local
```

### 5. Levantar el proyecto

```bash
npm install      # ya ejecutado durante el scaffold
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000). Te va a redirigir a
`/login`. Ingresá con el usuario que creaste.

---

## Flujo de uso

1. **Configuración** (`/configuracion`): cargá los datos de tu agencia (logo,
   nombre, contacto, color, redes). Hacelo primero — las propuestas usan estos
   datos.
2. **Nueva propuesta** (`/propuestas/nueva`): cliente, contenido, items con
   precios (ARS/USD), vigencia y términos. Autoguardado cada 30 s.
3. **Previsualizar**: mirá cómo lo ve el cliente. Desde ahí podés copiar el link
   y marcarla como enviada.
4. **Enviar**: genera el slug definitivo, marca la propuesta como `enviada` y
   copia el link único al portapapeles.
5. **Tracking**: cuando el cliente abre `/p/[slug]`, se registra la visita, el
   estado pasa a `vista` y te llega un email. Si acepta, pasa a `aceptada` y
   recibís otra notificación.

---

## Estructura

- `src/app/(auth)` — login.
- `src/app/(dashboard)` — dashboard, propuestas, editor, configuración (rutas
  protegidas por `middleware.ts`).
- `src/app/p/[slug]` — vista pública de la propuesta (sin login).
- `src/app/api` — `track`, `aceptar`, `rechazar`, `pdf`.
- `src/components` — `dashboard`, `editor`, `proposal`, `config`, `ui` (shadcn).
- `src/lib` — `supabase`, `types.ts`, `formatters.ts`, `stats.ts`, `tracking.ts`,
  `email.ts`, `utils.ts`.

---

## Notas técnicas

- **Auth/SSR**: se usa `@supabase/ssr` (el paquete `auth-helpers-nextjs` está
  deprecado y su última versión ya no exporta los helpers clásicos).
- **Reorden de items**: con botones ↑/↓ (sin librería de drag-and-drop), como
  indica el spec para el MVP.
- **Persistencia de items**: al guardar, se reemplazan en bloque (delete +
  insert) porque ningún recurso externo referencia sus IDs.
- **Tipo de cambio**: es solo informativo para el cliente, no afecta el precio
  pactado.

---

## Deploy en Vercel

1. Subí el repo a GitHub.
2. Importá el proyecto en Vercel.
3. Cargá las mismas variables de entorno (con `NEXT_PUBLIC_APP_URL` apuntando a
   tu dominio de producción).
4. Deploy.
