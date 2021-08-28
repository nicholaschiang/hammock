// This file configures the initialization of Sentry on the browser.
// The config you add here will be used whenever a page is visited.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn:
    SENTRY_DSN ||
    'https://714cd7f7323d4a5b8ef2c0a580fb034d@o956434.ingest.sentry.io/5905800',
  integrations: [
    new Sentry.Integrations.BrowserTracing({
      shouldCreateSpanForRequest(url) {
        const preloads = [
          '/api/account',
          '/api/messages',
          '/api/sync',
          '/api/subscriptions',
          '/api/highlights',
        ];
        return preloads.every((p) => !url.endsWith(p));
      },
    }),
  ],
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1.0,
  // ...
  // Note: if you want to override the automatic release value, do not set a
  // `release` value here - use the environment variable `SENTRY_RELEASE`, so
  // that it will also get attached to your source maps
});
