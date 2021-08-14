import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { APIErrorJSON } from 'lib/model/error';
import { MessageJSON } from 'lib/model/message';
import { Query } from 'lib/model/query';
import { getMessages } from 'lib/api/db/message';
import { handle } from 'lib/api/error';
import logger from 'lib/api/logger';
import segment from 'lib/api/segment';
import verifyAuth from 'lib/api/verify/auth';

export type MessagesRes = MessageJSON[];

/**
 * GET - Lists the messages for the given user.
 *
 * Requires a JWT; will return the messages for that user.
 */
export default async function messagesAPI(
  req: Req,
  res: Res<MessagesRes | APIErrorJSON>
): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method as string} Not Allowed`);
  } else {
    try {
      console.time('get-messages-api');
      const user = await verifyAuth(req);
      const messages = await getMessages(req.query as Query);
      res.status(200).json(messages.map((m) => m.toJSON()));
      logger.info(`Fetched ${messages.length} messages for ${user}.`);
      console.timeEnd('get-messages-api');
      segment.track({
        userId: user.id,
        event: 'Messages Listed',
        properties: messages.map((m) => m.toSegment()),
      });
    } catch (e) {
      handle(e, res);
    }
  }
}
