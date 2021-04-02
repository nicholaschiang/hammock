import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { APIErrorJSON } from 'lib/api/error';
import { MessageJSON } from 'lib/model/message';
import createLabel from 'lib/api/create/label';
import getMessages from 'lib/api/get/messages';
import getUser from 'lib/api/get/user';
import { handle } from 'lib/api/error';
import updateUserDoc from 'lib/api/update/user-doc';
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
      const user = await getUser(uid);
      if (!user.label) user.label = await createLabel(user);
      const messages = await getMessages(user);
      res.status(200).json(messages.map((m) => m.toJSON()));
      await updateUserDoc(user);
    } catch (e) {
      handle(e, res);
    }
  }
}
