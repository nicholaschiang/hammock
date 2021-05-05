import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { Message, MessageJSON, isMessageJSON } from 'lib/model/message';
import { APIErrorJSON } from 'lib/model/error';
import getGmailMessage from 'lib/api/get/gmail-message';
import getUser from 'lib/api/get/user';
import gmail from 'lib/api/gmail';
import { handle } from 'lib/api/error';
import logger from 'lib/api/logger';
import { messageFromGmail } from 'lib/utils/convert';
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
    const { uid } = await verifyAuth(req.headers);
    const user = await getUser(uid);
    const gmailMessage = await getGmailMessage(id, gmail(user.token));
    const messageData = messageFromGmail(gmailMessage);
    res.status(200).json(messageData.toJSON());
    logger.info(`Fetched ${messageData} for ${user}.`);
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
    const { uid } = await verifyAuth(req.headers);
    await updateMessageDoc(uid, body);
    res.status(200).json(body.toJSON());
    logger.info(`Updated ${body} for user (${uid}).`);
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
