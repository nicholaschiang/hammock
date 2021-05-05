import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { APIErrorJSON } from 'lib/model/error';
import { MessageJSON } from 'lib/model/message';
import getGmailMessage from 'lib/api/get/gmail-message';
import getUser from 'lib/api/get/user';
import gmail from 'lib/api/gmail';
import { handle } from 'lib/api/error';
import logger from 'lib/api/logger';
import { messageFromGmail } from 'lib/utils/convert';
import verifyAuth from 'lib/api/verify/auth';
import verifyQueryId from 'lib/api/verify/query-id';

export type MessageRes = MessageJSON;

export default async function message(
  req: Req,
  res: Res<MessageRes | APIErrorJSON>
): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method as string} Not Allowed`);
  } else {
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
}
