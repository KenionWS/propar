/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server mínimo y autocontenido: menos RAM y arranque más rápido.
  // Recomendado para hosting Node con recursos limitados (Hostinger).
  output: 'standalone',
};

export default nextConfig;
