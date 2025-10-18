export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    '@primevue/nuxt-module',
    '@nuxtjs/supabase',
    '@nuxtjs/storybook',
    '@nuxt/test-utils/module',
    '@pinia/nuxt',
    '@vee-validate/nuxt'
  ],
  primevue: {
    options: { theme: 'none' },
},
  css: ['@/assets/styles/tailwind.css', '@/assets/styles/base.css', 'primeicons/primeicons.css'],
  postcss: {
    plugins: {
        'postcss-import': {},
        tailwindcss: {},
        autoprefixer: {},
    }
},
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_KEY,
    redirect: false
  },
  runtimeConfig: {
    // Private: available only on the server-side
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,

    // AWS S3 Configuration
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    awsRegion: process.env.AWS_REGION,
    awsS3Bucket: process.env.AWS_S3_BUCKET,

    // Public: safely exposed to the client-side
    public: {
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY
    }
  },
})