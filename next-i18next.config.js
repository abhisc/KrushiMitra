module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'hi', 'kn', 'ta'],
    localeDetection: true,
  },
  localePath: typeof window === 'undefined' ? require('path').resolve('./public/locales') : '/locales',
  reloadOnPrerender: process.env.NODE_ENV === 'development',
} 