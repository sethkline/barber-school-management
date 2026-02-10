export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    '@primevue/nuxt-module',
    '@nuxtjs/storybook',
    '@nuxt/test-utils/module',
    '@pinia/nuxt',
    '@vee-validate/nuxt'
  ],
  primevue: {
    options: { theme: 'none' }
  },
  css: ['@/assets/styles/tailwind.css', '@/assets/styles/base.css', 'primeicons/primeicons.css'],
  postcss: {
    plugins: {
      'postcss-import': {},
      tailwindcss: {},
      autoprefixer: {}
    }
  },
  runtimeConfig: {
    // Database Configuration
    databaseUrl: process.env.DATABASE_URL,

    // AWS Cognito Configuration
    cognitoUserPoolId: process.env.COGNITO_USER_POOL_ID,
    cognitoClientId: process.env.COGNITO_CLIENT_ID,
    cognitoClientSecret: process.env.COGNITO_CLIENT_SECRET,
    cognitoIssuerUrl: process.env.COGNITO_ISSUER_URL,

    // AWS General Configuration
    awsRegion: process.env.AWS_REGION || 'us-east-1',
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,

    // AWS S3 Configuration
    awsS3Bucket: process.env.AWS_S3_BUCKET,

    // AWS SNS Configuration
    snsTopicArn: process.env.SNS_TOPIC_ARN,

    // AWS SES Configuration
    sesFromEmail: process.env.SES_FROM_EMAIL,

    // Public: safely exposed to the client-side
    public: {
      appName: 'Barber School',
      appUrl: process.env.APP_URL || 'http://localhost:3000'
    }
  }
})
