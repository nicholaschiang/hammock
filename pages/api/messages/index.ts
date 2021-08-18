import { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import { withSentry } from '@sentry/nextjs';

import { DBMessage, Message, MessageJSON } from 'lib/model/message';
import { HITS_PER_PAGE, MessagesQuery } from 'lib/model/query';
import { APIErrorJSON } from 'lib/model/error';
import { handle } from 'lib/api/error';
import logger from 'lib/api/logger';
import segment from 'lib/api/segment';
import supabase from 'lib/api/supabase';
import verifyAuth from 'lib/api/verify/auth';

export type MessagesRes = MessageJSON[];

/**
 * GET - Lists the messages for the given user.
 *
 * Requires a JWT; will return the messages for that user.
 */
async function messagesAPI(
  req: Req,
  res: Res<MessagesRes | APIErrorJSON>
): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method as string} Not Allowed`);
  } else {
    try {
      console.time('get-messages-api');
      const { quickRead, archive, resume, writer, page } =
        req.query as MessagesQuery;
      const user = await verifyAuth(req);
      const pg = Number.isNaN(Number(page)) ? 0 : Number(page);
      console.time('fetch-messages');
      logger.verbose(`Fetching messages for ${user}...`);
      // TODO: Refactor this and put it in a `getMessages` fx in `lib/api/db`
      // and put the `Query` data model definition in `lib/model/query.ts`.
      let select = supabase
        .from<DBMessage>('messages')
        .select()
        .eq('user', Number(user.id))
        .eq('archived', archive === 'true')
        .order('date', { ascending: false })
        .range(HITS_PER_PAGE * pg, HITS_PER_PAGE * (pg + 1) - 1);
      if (quickRead === 'true') select = select.lt('time', 5);
      if (resume === 'true') select = select.gt('scroll', 0);
      if (writer) select = select.eq('email', writer);
      // TODO: Add error catching here once we move this into `getUsers` fx.
      const { data } = await select;
      const messages = (data || []).map((d) => Message.fromDB(d));
      console.timeEnd('fetch-messages');
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

export default withSentry(messagesAPI);
