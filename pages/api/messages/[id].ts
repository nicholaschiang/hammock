import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { APIError, APIErrorJSON } from 'lib/model/error';
import { Message, MessageJSON, isMessageJSON } from 'lib/model/message';
import { db } from 'lib/api/firebase';
import { handle } from 'lib/api/error';
import logger from 'lib/api/logger';
import { parseRawHTML } from 'lib/api/message-from-gmail';
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
    const doc = await db.collection('users').doc(user.id).collection('messages').doc(id).get();
    // TODO: Try to fetch it from Gmail's API instead.
    if (!doc.exists) throw new APIError(`Message ${id} does not exist`, 404);
    const messageData = Message.fromFirestoreDoc(doc);
    const message = new Message({ ...messageData, ...parseRawHTML(messageData.raw) });
    res.status(200).json(message.toJSON());
    logger.info(`Fetched ${message} for ${user}.`);
    segment.track({
      userId: user.id,
      event: 'Message Fetched',
      properties: message.toSegment(),
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
export default async function message(
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
