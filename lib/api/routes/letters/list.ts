import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { MessageJSON } from 'lib/model/message';
import getMessages from 'lib/api/get/messages';
import { handle } from 'lib/api/error';
import verifyAuth from 'lib/api/verify/auth';

export type ListMessagesRes = MessageJSON[];

export default async function listMessages(
  req: Req,
  res: Res<ListMessagesRes>
): Promise<void> {
  try {
    const { uid } = await verifyAuth(req.headers);
    const letters = await getMessages(uid);
    res.status(200).json(letters.map((l) => l.toJSON()));
  } catch (e) {
    handle(e, res);
  }
}
