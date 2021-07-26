import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import {
  Message,
  MessageInterface,
  MessageJSON,
  isMessageJSON,
} from 'lib/model/message';
import { APIErrorJSON } from 'lib/model/error';
import { db } from 'lib/api/firebase';
import getGmailMessage from 'lib/api/get/gmail-message';
import gmail from 'lib/api/gmail';
import { handle } from 'lib/api/error';
import logger from 'lib/api/logger';
import messageFromGmail from 'lib/api/message-from-gmail';
import segment from 'lib/api/segment';
import updateMessageDoc from 'lib/api/update/message-doc';
import verifyAuth from 'lib/api/verify/auth';
import verifyBody from 'lib/api/verify/body';
import verifyQueryId from 'lib/api/verify/query-id';

export type MessageRes = MessageJSON;

async function fetchMessage(
  req: Req,
  res: Res<MessageRes | APIErrorJSON>
): Promise<void> {
  try {
    const id = verifyQueryId(req.query);
    const user = await verifyAuth(req);
    // We don't store the actual message content (subject, snippet, html) in our
    // database. Instead, we fetch that data at runtime and only store metadata.
    const doc = await db
      .collection('users')
      .doc(user.id)
      .collection('messages')
      .doc(id)
      .get();
    const client = gmail(user.token);
    const metadata = Message.fromFirestoreDoc(doc);
    const gmailMessage = messageFromGmail(await getGmailMessage(id, client));
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
    };
    res.status(200).json(new Message(combined).toJSON());
    logger.info(`Fetched ${metadata} for ${user}.`);
    segment.track({
      userId: user.id,
      event: 'Message Fetched',
      properties: metadata.toSegment(),
    });
  } catch (e) {
    handle(e, res);
  }
}

async function updateMessage(
  req: Req,
  res: Res<MessageRes | APIErrorJSON>
): Promise<void> {
  try {
    const body = verifyBody<Message, MessageJSON>(
      req.body,
      isMessageJSON,
      Message
    );
    const user = await verifyAuth(req);
    await updateMessageDoc(user.id, body);
    res.status(200).json(body.toJSON());
    logger.info(`Updated ${body} for ${user}.`);
    segment.track({
      userId: user.id,
      event: 'Message Updated',
      properties: body.toSegment(),
    });
  } catch (e) {
    handle(e, res);
  }
}

/**
 * GET - Fetches the message data (from Gmail's API and our database).
 * PUT - Updates the message metadata (in our database).
 *
 * Requires a JWT; will try to fetch the message from that user's data.
 */
export default async function messageAPI(
  req: Req,
  res: Res<MessageRes | APIErrorJSON>
): Promise<void> {
  switch (req.method) {
    case 'GET':
      await fetchMessage(req, res);
      break;
    case 'PUT':
      await updateMessage(req, res);
      break;
    default:
      res.setHeader('Allow', ['GET', 'PUT']);
      res.status(405).end(`Method ${req.method as string} Not Allowed`);
  }
}
