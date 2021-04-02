import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { APIError, APIErrorJSON } from 'lib/model/error';
import { Filter } from 'lib/model/user';
import getOrCreateFilter from 'lib/api/get/filter';
import getUser from 'lib/api/get/user';
import { handle } from 'lib/api/error';
import verifyAuth from 'lib/api/verify/auth';
import logger from 'lib/api/logger';

/**
 * POST - Creates a new Gmail filter for the given user.
 *
 * Requires a JWT; will create the filter for that user.
 * @todo Retroactively move old messages to the filter.
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
      if (typeof req.body !== 'string')
        throw new APIError('Invalid request body', 400);
      const { uid } = await verifyAuth(req.headers);
      const user = await getUser(uid);
      const existing = user.filters.find((f) => f.from === req.body);
      if (existing) {
        res.status(200).json(existing);
        logger.info(`Fetched filter (${existing.from}) for ${user}.`);
      } else {
        const filter = await getOrCreateFilter(user, req.body);
        res.status(201).json(filter);
        logger.info(`Created filter (${filter.from}) for ${user}.`);
      }
    } catch (e) {
      handle(e, res);
    }
  }
}
