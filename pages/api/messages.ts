import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import listMessages, { ListMessagesRes } from 'lib/api/routes/messages/list';
import { APIError } from 'lib/api/error';

/**
 * GET - Lists the messages for the given user.
 *
 * Requires a JWT; will return the messages for that user.
 */
export default async function messages(
  req: Req,
  res: Res<ListMessagesRes | APIError>
): Promise<void> {
  switch (req.method) {
    case 'GET':
      await listMessages(req, res);
      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${req.method as string} Not Allowed`);
  }
}
