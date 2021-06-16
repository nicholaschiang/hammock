import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { APIErrorJSON } from 'lib/model/error';
import { handle } from 'lib/api/error';
import logger from 'lib/api/logger';
import syncGmail from 'lib/api/sync-gmail';
import verifyAuth from 'lib/api/verify/auth';

/**
 * GET - Recursively syncs the Gmail messages for the given user.
 *
 * Requires a JWT; will sync the Gmail messages for that user.
 */
export default async function syncAPI(
  req: Req,
  res: Res<APIErrorJSON>
): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method as string} Not Allowed`);
  } else {
    try {
      const { pageToken } = req.query as { pageToken?: string };
      const user = await verifyAuth(req);
      logger.verbose(`Syncing messages for ${user}...`);
      const nextPageToken = await syncGmail(user, pageToken);
      if (nextPageToken) {
        res.redirect(`/api/sync?pageToken=${nextPageToken}`);
        logger.info(`Redirected to sync the next 10 messages for ${user}.`);
      } else {
        res.status(200).end();
        logger.info(`Finished syncing messages for ${user}.`);
      }
    } catch (e) {
      handle(e, res);
    }
  }
}
