export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  srcDir: 'src/',
  serverDir: 'server/',
  devServer: { port: 3001 },
  devtools: { enabled: true },
  modules: ['@pinia/nuxt', '@nuxt/eslint'],
  css: ['~/assets/scss/main.scss'],
  typescript: { strict: true },
  runtimeConfig: {
    apiBase: 'http://127.0.0.1:3000',
  },
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'Susi Air Pilot App',
    },
  },
});
