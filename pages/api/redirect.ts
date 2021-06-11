import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { APIErrorJSON } from 'lib/model/error';
import { handle } from 'lib/api/error';
import logger from 'lib/api/logger';
import verifyAuth from 'lib/api/verify/auth';

/**
 * GET - Redirects the user to their feed or, if they don't have any 
 *       subscriptions selected, the subscriptions page.
 *
 * Requires a JWT.
 */
export default async function redirect(
  req: Req,
  res: Res<APIErrorJSON>
): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method as string} Not Allowed`);
  } else {
    try {
      const user = await verifyAuth(req);
      if (user.subscriptions.length) {
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
