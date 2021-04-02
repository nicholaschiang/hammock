import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { Filter, isFilter } from 'lib/model/user';
import { APIErrorJSON } from 'lib/model/error';
import createFilter from 'lib/api/create/filter';
import getUser from 'lib/api/get/user';
import { handle } from 'lib/api/error';
import verifyAuth from 'lib/api/verify/auth';
import verifyBody from 'lib/api/verify/body';
import logger from 'lib/api/logger';

/**
 * POST - Creates a new Gmail filter for the given user.
 *
 * Requires a JWT; will create the filter for that user.
 */
export default async function filters(
  req: Req,
  res: Res<Filter | APIErrorJSON>
): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method as string} Not Allowed`);
  } else {
    try {
      // TODO: Retroactively move old messages to the filter.
      const body = verifyBody<Filter>(req.body, isFilter);
      const { uid } = await verifyAuth(req.headers);
      const user = await getUser(uid);
      const filter = await createFilter(user, body);
      res.status(200).json(filter);
      logger.info(`Created filter (${filter.from}) for ${user}.`);
    } catch (e) {
      handle(e, res);
    }
  }
}
