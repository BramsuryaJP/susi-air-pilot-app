export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  srcDir: 'src/',
  dir: { public: '../public' },
  serverDir: 'server/',
  devServer: { port: 3001 },
  devtools: { enabled: true },
  modules: ['@pinia/nuxt', '@nuxt/eslint'],
  css: ['~/assets/scss/main.scss'],
  typescript: { strict: true },
  runtimeConfig: {
    apiBase: 'http://127.0.0.1:3000',
    appOrigin: 'http://localhost:3001',
  },
  routeRules: {
    '/**': {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'no-referrer',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      },
    },
    '/api/**': {
      headers: {
        'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
      },
    },
    '/': { headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } },
    '/schedule': {
      headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' },
    },
    '/duty/**': {
      headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' },
    },
    '/login': {
      headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' },
    },
    '/api/auth/**': {
      headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' },
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'Susi Air Pilot App',
      meta: [
        { name: 'theme-color', content: '#0E2138' },
        {
          name: 'description',
          content: 'Susi Air pilot flight hours, documents, and duty schedule.',
        },
      ],
      link: [
        {
          rel: 'preload',
          href: '/fonts/plus-jakarta-sans-latin-variable.woff2',
          as: 'font',
          type: 'font/woff2',
          crossorigin: 'anonymous',
        },
      ],
    },
  },
});
