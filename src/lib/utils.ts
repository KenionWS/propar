import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Convierte un texto a un slug url-safe. */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const NANO_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'

/** Genera un id corto aleatorio (nanoid-like) sin dependencias extra. */
export function nanoid(size = 4): string {
  let id = ''
  const bytes = new Uint8Array(size)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes)
  } else {
    for (let i = 0; i < size; i++) bytes[i] = Math.floor(Math.random() * 256)
  }
  for (let i = 0; i < size; i++) {
    id += NANO_ALPHABET[bytes[i] % NANO_ALPHABET.length]
  }
  return id
}

/** slug de propuesta: nombre-cliente-4chars. ej: textil-moyano-a3x9 */
export function generarSlug(clienteNombre: string): string {
  const base = slugify(clienteNombre) || 'propuesta'
  return `${base}-${nanoid(4)}`
}
