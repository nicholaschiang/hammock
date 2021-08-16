import { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import to from 'await-to-js';
import { withSentry } from '@sentry/nextjs';

import { APIErrorJSON } from 'lib/model/error';
import { SCOPES } from 'lib/model/user';
import { handle } from 'lib/api/error';
import logger from 'lib/api/logger';
import verifyAuth from 'lib/api/verify/auth';

/**
 * GET - Redirects the user to their feed or, if they don't have any
 *       subscriptions selected, the subscriptions page.
 *
 * Requires a JWT.
 */
async function redirectAPI(req: Req, res: Res<APIErrorJSON>): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method as string} Not Allowed`);
  } else {
    try {
      const [err, user] = await to(verifyAuth(req));
      if (err) {
        logger.warn(`${err.name} verifying authentication: ${err.message}`);
        res.redirect('/feed');
      } else if (
        user &&
        !Object.values(SCOPES).every((s) => user.scopes.includes(s))
      ) {
        Object.entries(SCOPES).some(([scope, url]) => {
          if (user.scopes.includes(url)) return false;
          logger.error(`Missing ${scope} scope (${url}) for ${user}...`);
          res.redirect(`/login?error=${scope}`);
          return true;
        });
      } else if (user?.subscriptions.length) {
        logger.info(`Redirecting ${user} to feed...`);
        res.redirect('/feed');
      } else {
        logger.info(`Redirecting ${user} to subscriptions...`);
        res.redirect('/subscriptions');
      }
    } catch (e) {
      handle(e, res);
    }
  }
}

export default withSentry(redirectAPI);
