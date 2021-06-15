module.exports = {
  reactStrictMode: true,
  future: { webpack5: true },
  i18n: { locales: ['en-US'], defaultLocale: 'en-US' },
  images: {
    domains: [
      'cdn.substack.com',
      'assets.tutorbook.org',
      'lh3.googleusercontent.com',
      'www.google.com',
    ],
  },
  async rewrites() {
    return [
      {
        source: '/about',
        destination: '/',
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/terms',
        destination:
          'https://www.notion.so/Terms-of-Service-ab660e15db814a118d908391eac43991',
        permanent: true,
      },
      {
        source: '/privacy',
        destination:
          'https://www.notion.so/Privacy-Policy-4f8a21493d384592a206453492fbce4c',
        permanent: true,
      },
      {
        source: '/story',
        destination:
          'https://www.notion.so/readhammock/Return-of-the-Newsletter-524563869f6242baaa60250299536654',
        permanent: true,
      },
    ];
  },
  webpack(config, { isServer }) {
    if (!isServer && process.env.ANALYZE === 'true') {
      // Only run the bundle analyzer for the client-side chunks.
      // @see {@link https://github.com/vercel/next.js/issues/15481}
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: './analyze/client.html',
          generateStatsFile: true,
        })
      );
    }
    return config;
  },
};
