/** @type {import('next').NextConfig} */
const nextConfig = {
  // ========== CONFIGURAÇÕES PARA ELECTRON ==========
  output: 'standalone',
  distDir: '.next',
  trailingSlash: false,

  // ========== OTIMIZAÇÃO DE IMAGENS ==========
  images: {
    unoptimized: true,
    domains: ['localhost'],
  },

  // ========== IGNORAR ERROS DE LINT ==========
  eslint: {
    ignoreDuringBuilds: true,
  },

  // ========== IGNORAR ERROS DE TYPESCRIPT ==========
  typescript: {
    ignoreBuildErrors: true,
  },

  // ========== DESABILITAR TELEMETRIA ==========
  telemetry: false,

  // ========== HEADERS DE SEGURANÇA ==========
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      // 🔥 ADICIONAR HEADER PARA FAVICON (FORÇA ATUALIZAÇÃO DO CACHE)
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      {
        source: '/favicon-v2.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      {
        source: '/favicon.png',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ];
  },

  // ========== WEBPACK ==========
  webpack: (config, { isServer }) => {
    // Ignorar a pasta electron no build do Next.js
    config.watchOptions = {
      ignored: ['**/node_modules', '**/electron/**'],
    };

    return config;
  },
};

module.exports = nextConfig;
