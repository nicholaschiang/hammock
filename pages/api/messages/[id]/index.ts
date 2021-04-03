import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { APIErrorJSON } from 'lib/model/error';
import { MessageJSON } from 'lib/model/message';
import getMessage from 'lib/api/get/message';
import getUser from 'lib/api/get/user';
import { handle } from 'lib/api/error';
import verifyAuth from 'lib/api/verify/auth';
import verifyQueryId from 'lib/api/verify/query-id';
import logger from 'lib/api/logger';
import gmail from 'lib/api/gmail';

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
      const message = await getMessage(id, gmail(user.token));
      res.status(200).json(message.toJSON());
      logger.info(`Fetched ${message} for ${user}.`);
    } catch (e) {
      handle(e, res);
    }
  }
}
