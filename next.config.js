module.exports = {
  future: { webpack5: true },
  reactStrictMode: true,
  images: {
    domains: [
      'assets.tutorbook.org',
      'firebasestorage.googleapis.com',
      'www.google.com',
    ],
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
