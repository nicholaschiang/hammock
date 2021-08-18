import { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import { withSentry } from '@sentry/nextjs';

declare global {
  /* eslint-disable-next-line @typescript-eslint/no-namespace */
  namespace NodeJS {
    interface Global {
      __coverage__: unknown;
    }
  }
}

/**
 * GET - Fetches the server-side code coverage.
 *
 * This API endpoint is used during development by the `@cypress/code-coverage`
 * plugin to get the results of the server-side Istanbul code instrumentation.
 *
 * The endpoint just returns the existing global coverage object or `null`.
 *
 * @see {@link https://nextjs.org/docs#api-routes}
 * @see {@link https://github.com/cypress-io/code-coverage}
 * @see {@link https://github.com/bahmutov/next-and-cypress-example}
 * @see {@link https://github.com/lluia/cypress-typescript-coverage-example}
 */
function coverageAPI(req: Req, res: Res): void {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method as string} Not Allowed`);
  } else {
    /* eslint-disable-next-line no-underscore-dangle */
    res.status(200).json({ coverage: global.__coverage__ || null });
  }
}

export default withSentry(coverageAPI);
