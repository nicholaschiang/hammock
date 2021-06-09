import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { Message, MessageJSON } from 'lib/model/message';
import { APIErrorJSON } from 'lib/model/error';
import { db } from 'lib/api/firebase';
import { handle } from 'lib/api/error';
import logger from 'lib/api/logger';
import segment from 'lib/api/segment';
import verifyAuth from 'lib/api/verify/auth';

export type MessagesQuery = {
  lastMessageId?: string;
  quickRead?: 'true' | 'false';
  archive?: 'true' | 'false';
  resume?: 'true' | 'false';
};

export type MessagesRes = MessageJSON[];

/**
 * GET - Lists the messages for the given user.
 *
 * Requires a JWT; will return the messages for that user.
 */
export default async function messages(
  req: Req,
  res: Res<MessagesRes | APIErrorJSON>
): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method as string} Not Allowed`);
  } else {
    try {
      const {
        lastMessageId,
        quickRead,
        archive,
        resume,
      } = req.query as MessagesQuery;
      const user = await verifyAuth(req);
      logger.verbose(`Fetching messages for ${user}...`);
      const ref = db.collection('users').doc(user.id).collection('messages');
      let query = ref.where('archived', '==', archive === 'true');
      if (quickRead === 'true')
        query = query.where('time', '<=', 10).orderBy('time');
      if (resume === 'true')
        query = query.where('scroll', '>', 0).orderBy('scroll');
      query = query.orderBy('date', 'desc').limit(10);
      if (lastMessageId) {
        const lastMessageDoc = await ref.doc(lastMessageId).get();
        query = query.startAfter(lastMessageDoc);
      }
      const { docs } = await query.get();
      const messagesData = docs.map((d) => Message.fromFirestoreDoc(d));
      res.status(200).json(messagesData.map((m) => m.toJSON()));
      logger.info(`Fetched ${messagesData.length} messages for ${user}.`);
      segment.track({
        userId: user.id,
        event: 'Messages Listed',
        properties: messagesData.map((m) => m.toSegment()),
      });
    } catch (e) {
      handle(e, res);
    }
  }
}
