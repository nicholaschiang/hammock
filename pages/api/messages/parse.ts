import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { APIErrorJSON } from 'lib/model/error';
import { GmailMessage } from 'lib/api/gmail';
import { MessageJSON } from 'lib/model/message';
import { handle } from 'lib/api/error';
import messageFromGmail from 'lib/api/message-from-gmail';

export default function parseMessageAPI(
  req: Req,
  res: Res<MessageJSON | APIErrorJSON>
): void {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method as string} Not Allowed`);
  } else {
    try {
      const message = messageFromGmail(req.body as GmailMessage);
      res.status(200).json(message.toJSON());
    } catch (e) {
      handle(e, res);
    }
  }
}
