import { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import { withSentry } from '@sentry/nextjs';

import { User, UserJSON, isUserJSON } from 'lib/model/user';
import { APIErrorJSON } from 'lib/model/error';
import getOrCreateFilter from 'lib/api/get/filter';
import getOrCreateLabel from 'lib/api/get/label';
import { handle } from 'lib/api/error';
import logger from 'lib/api/logger';
import segment from 'lib/api/segment';
import syncGmail from 'lib/api/sync-gmail';
import updateGmailMessages from 'lib/api/update/gmail-messages';
import { upsertUser } from 'lib/api/db/user';
import verifyAuth from 'lib/api/verify/auth';
import verifyBody from 'lib/api/verify/body';

async function fetchAccount(req: Req, res: Res<UserJSON>): Promise<void> {
  console.time('get-account');
  try {
    const user = await verifyAuth(req);
    res.status(200).json(user.toJSON());
    logger.info(`Fetched ${user}.`);
    segment.track({
      userId: user.id,
      event: 'User Fetched',
      properties: user.toSegment(),
    });
  } catch (e) {
    handle(e, res);
  }
  console.timeEnd('get-account');
}

async function updateAccount(req: Req, res: Res<UserJSON>): Promise<void> {
  console.time('put-account');
  try {
    const body = verifyBody<User, UserJSON>(req.body, isUserJSON, User);
    await verifyAuth(req, body.id);
    await Promise.all([upsertUser(body), syncGmail(body)]);
    res.status(200).json(body.toJSON());
    logger.info(`Updated ${body}.`);
    segment.track({
      userId: body.id,
      event: 'User Updated',
      properties: body.toSegment(),
    });
    body.label = await getOrCreateLabel(body);
    body.filter = await getOrCreateFilter(body);
    await Promise.all([upsertUser(body), updateGmailMessages(body)]);
    logger.info(`Retroactively filtered messages for ${body}.`);
  } catch (e) {
    handle(e, res);
  }
  console.timeEnd('put-account');
}

/**
 * GET - Fetches the user's profile data. Called continuously.
 * PUT - Updates and overwrites the user's profile data. Called after setup.
 *
 * Requires a JWT; will return the profile data of that user.
 */
async function accountAPI(
  req: Req,
  res: Res<UserJSON | APIErrorJSON>
): Promise<void> {
  throw new Error('This is a fake production API route error!');
  switch (req.method) {
    case 'GET':
      await fetchAccount(req, res);
      break;
    case 'PUT':
      await updateAccount(req, res);
      break;
    default:
      res.setHeader('Allow', ['GET', 'PUT']);
      res.status(405).end(`Method ${req.method as string} Not Allowed`);
  }
}

export default withSentry(accountAPI);
