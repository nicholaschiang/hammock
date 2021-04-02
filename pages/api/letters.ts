import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { APIErrorJSON } from 'lib/model/error';
import { LetterJSON } from 'lib/model/letter';
import getLetters from 'lib/api/get/letters';
import getUser from 'lib/api/get/user';
import { handle } from 'lib/api/error';
import verifyAuth from 'lib/api/verify/auth';
import logger from 'lib/api/logger';

/**
 * GET - Lists the letters for the given user.
 *
 * Requires a JWT; will return the letters for that user.
 */
export default async function letters(
  req: Req,
  res: Res<LetterJSON[] | APIErrorJSON>
): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method as string} Not Allowed`);
  } else {
    try {
      const { uid } = await verifyAuth(req.headers);
      const user = await getUser(uid);
      const letters = await getLetters(user);
      res.status(200).json(letters.map((l) => l.toJSON()));
      logger.info(`Fetched ${letters.length} letters for ${user}.`);
    } catch (e) {
      handle(e, res);
    }
  }
}
