import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import listLetters, { ListLettersRes } from 'lib/api/routes/letters/list';
import { APIError } from 'lib/api/error';

/**
 * GET - Lists the letters for the given user.
 *
 * Requires a JWT; will return the letters for that user.
 */
export default async function letters(
  req: Req,
  res: Res<ListLettersRes | APIError>
): Promise<void> {
  switch (req.method) {
    case 'GET':
      await listLetters(req, res);
      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${req.method as string} Not Allowed`);
  }
}
