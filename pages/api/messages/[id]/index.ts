import { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import { withSentry } from '@sentry/nextjs';

import { Message, isMessage } from 'lib/model/message';
import { getMessage, updateMessage } from 'lib/api/db/message';
import { APIErrorJSON } from 'lib/model/error';
import { handle } from 'lib/api/error';
import logger from 'lib/api/logger';
import segment from 'lib/api/segment';
import verifyAuth from 'lib/api/verify/auth';
import verifyBody from 'lib/api/verify/body';
import verifyQueryId from 'lib/api/verify/query-id';

export type MessageRes = Message;

async function fetchMessageAPI(
  req: Req,
  res: Res<MessageRes | APIErrorJSON>
): Promise<void> {
  try {
    const id = verifyQueryId(req.query);
    console.time(`fetch-message-${id}`);
    const user = await verifyAuth(req);
    const message = await getMessage(id);
    res.status(200).json(message);
    logger.info(
      `Fetched message (${message.id}) for ${user.name} (${user.id}).`
    );
    console.timeEnd(`fetch-message-${id}`);
    segment.track({ userId: user.id, event: 'Message Fetched' });
  } catch (e) {
    handle(e, res);
  }
}

async function updateMessageAPI(
  req: Req,
  res: Res<MessageRes | APIErrorJSON>
): Promise<void> {
  try {
    const body = verifyBody<Message>(req.body, isMessage);
    console.time(`update-message-${body.id}`);
    const user = await verifyAuth(req);
    const message = await updateMessage(body);
    res.status(200).json(message);
    logger.info(
      `Updated message (${message.id}) for ${user.name} (${user.id}).`
    );
    console.timeEnd(`update-message-${body.id}`);
    segment.track({ userId: user.id, event: 'Message Updated' });
  } catch (e) {
    handle(e, res);
  }
}

/**
 * GET - Fetches the message data (from our database).
 * PUT - Updates the message metadata (in our database).
 *
 * Requires a JWT; will try to fetch the message from that user's data.
 */
async function messageAPI(
  req: Req,
  res: Res<MessageRes | APIErrorJSON>
): Promise<void> {
  switch (req.method) {
    case 'GET':
      await fetchMessageAPI(req, res);
      break;
    case 'PUT':
      await updateMessageAPI(req, res);
      break;
    default:
      res.setHeader('Allow', ['GET', 'PUT']);
      res.status(405).end(`Method ${req.method as string} Not Allowed`);
  }
}

export default withSentry(messageAPI);
