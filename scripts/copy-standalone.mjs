// Copia los assets estáticos al bundle standalone de Next.
// El server standalone (.next/standalone/server.js) NO incluye `public`
// ni `.next/static` automáticamente; hay que copiarlos al lado.
import { cpSync, existsSync } from 'node:fs'

const STANDALONE = '.next/standalone'

if (!existsSync(STANDALONE)) {
  console.log('[postbuild] no hay build standalone, nada que copiar.')
  process.exit(0)
}

if (existsSync('public')) {
  cpSync('public', `${STANDALONE}/public`, { recursive: true })
}
if (existsSync('.next/static')) {
  cpSync('.next/static', `${STANDALONE}/.next/static`, { recursive: true })
}

console.log('[postbuild] copiados public y .next/static al server standalone.')
