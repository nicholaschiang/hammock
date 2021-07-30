import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { Message, MessageInterface, MessageJSON } from 'lib/model/message';
import gmail, { GmailMessage } from 'lib/api/gmail';
import { APIErrorJSON } from 'lib/model/error';
import { db } from 'lib/api/firebase';
import { fetcher } from 'lib/fetch';
import getGmailMessages from 'lib/api/get/gmail-messages';
import { handle } from 'lib/api/error';
import logger from 'lib/api/logger';
import segment from 'lib/api/segment';
import verifyAuth from 'lib/api/verify/auth';

export type MessagesQuery = {
  lastMessageId?: string;
  quickRead?: 'true' | 'false';
  archive?: 'true' | 'false';
  resume?: 'true' | 'false';
  writer?: string;
};

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
      const { lastMessageId, quickRead, archive, resume, writer } =
        req.query as MessagesQuery;
      const user = await verifyAuth(req);
      console.time('fetch-messages');
      logger.verbose(`Fetching messages for ${user}...`);
      const ref = db.collection('users').doc(user.id).collection('messages');
      let query = ref.where('archived', '==', archive === 'true');
      if (quickRead === 'true') query = query.where('quickRead', '==', true);
      if (resume === 'true') query = query.where('resume', '==', true);
      if (writer) query = query.where('from.email', '==', writer);
      query = query.orderBy('date', 'desc').limit(5);
      if (lastMessageId) {
        const lastMessageDoc = await ref.doc(lastMessageId).get();
        query = query.startAfter(lastMessageDoc);
      }
      const { docs } = await query.get();
      console.timeEnd('fetch-messages');
      const client = gmail(user.token);
      const gmailMessages = await getGmailMessages(
        docs.map((d) => d.id),
        client
      );
      const messages = await Promise.all(
        docs.map(async (doc, idx) => {
          // We don't store the actual message content in our database. Instead,
          // we fetch that data here at runtime and only store metadata.
          const gmailMessage = Message.fromJSON(
            await fetcher<MessageJSON, GmailMessage>(
              `http://${req.headers.host}/api/messages/parse`,
              'post',
              gmailMessages[idx]
            )
          );
          const metadata = Message.fromFirestoreDoc(doc);
          const combined: MessageInterface = {
            from: metadata.from,
            category: metadata.category,
            favorite: metadata.favorite,
            id: metadata.id,
            date: metadata.date,
            subject: gmailMessage.subject,
            snippet: gmailMessage.snippet,
            raw: gmailMessage.raw,
            html: gmailMessage.html,
            archived: metadata.archived,
            scroll: metadata.scroll,
            time: metadata.time,
            highlights: metadata.highlights,
          };
          return new Message(combined);
        })
      );
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
