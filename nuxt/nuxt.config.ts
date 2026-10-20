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
    '/': { headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } },
    '/schedule': {
      headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' },
    },
    '/duty/**': {
      headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' },
    },
    '/login': { headers: { 'Cache-Control': 'private, no-store' } },
    '/api/auth/**': {
      headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' },
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'Susi Air Pilot App',
    },
  },
});
