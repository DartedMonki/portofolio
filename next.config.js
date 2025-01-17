/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  images: {
    domains: ['avatars.githubusercontent.com'],
    formats: ['image/webp'],
    minimumCacheTTL: 60,
  },
  i18n: {
    // These are all the locales you want to support in
    // your application
    locales: ['en', 'id'],
    // This is the default locale you want to be used when visiting
    // a non-locale prefixed path e.g. `/hello`
    defaultLocale: 'en',
    localeDetection: false,
  },
  experimental: {
    scrollRestoration: true,
  },
};
