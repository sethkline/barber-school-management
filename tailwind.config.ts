/** @type {import('tailwindcss').Config} */ const primeui = require('tailwindcss-primeui');
module.exports = {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './nuxt.config.{js,ts}',
    './app.vue',
    './error.vue'
  ],
  // add secondary color primary is already defined in theme and is in base.css
  theme: {
    extend: {
      colors: {
        'secondary-50': 'var(--secondary-50)',
        'secondary-100': 'var(--secondary-100)',
        'secondary-200': 'var(--secondary-200)',
        'secondary-300': 'var(--secondary-300)',
        'secondary-400': 'var(--secondary-400)',
        'secondary-500': 'var(--secondary-500)',
        'secondary-600': 'var(--secondary-600)',
        'secondary-700': 'var(--secondary-700)',
        'secondary-800': 'var(--secondary-800)',
        'secondary-900': 'var(--secondary-900)',
        'secondary-950': 'var(--secondary-950)',
      },
  },
},
  plugins: [primeui]
};
