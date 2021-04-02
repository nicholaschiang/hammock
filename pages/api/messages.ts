import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { APIErrorJSON } from 'lib/api/error';
import { MessageJSON } from 'lib/model/message';
import getMessages from 'lib/api/get/messages';
import { handle } from 'lib/api/error';
import verifyAuth from 'lib/api/verify/auth';

/**
 * GET - Lists the messages for the given user.
 *
 * Requires a JWT; will return the messages for that user.
 */
export default async function messages(
  req: Req,
  res: Res<MessageJSON[] | APIErrorJSON>
): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method as string} Not Allowed`);
  } else {
    try {
      const { uid } = await verifyAuth(req.headers);
      const messages = await getMessages(uid);
      res.status(200).json(messages.map((m) => m.toJSON()));
    } catch (e) {
      handle(e, res);
    }
  }
}
