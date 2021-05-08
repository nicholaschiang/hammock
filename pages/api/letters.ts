import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { Letter, LetterJSON } from 'lib/model/letter';
import { APIErrorJSON } from 'lib/model/error';
import getGmailMessages from 'lib/api/get/gmail-messages';
import getUser from 'lib/api/get/user';
import gmail from 'lib/api/gmail';
import { handle } from 'lib/api/error';
import logger from 'lib/api/logger';
import messageFromGmail from 'lib/api/message-from-gmail';
import verifyAuth from 'lib/api/verify/auth';

export type LettersRes = LetterJSON[];

/**
 * GET - Lists the letters for the given user.
 *
 * Requires a JWT; will return the letters for that user.
 */
export default async function letters(
  req: Req,
  res: Res<LettersRes | APIErrorJSON>
): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method as string} Not Allowed`);
  } else {
    try {
      const { pageToken } = req.query as { pageToken?: string };
      const { uid } = await verifyAuth(req.headers);
      const user = await getUser(uid);
      logger.verbose(`Fetching letters for ${user}...`);
      const client = gmail(user.token);
      const { data } = await client.users.messages.list({
        maxResults: 100,
        userId: 'me',
        pageToken,
      });
      const messageIds = (data.messages || []).map((m) => m.id as string);
      const lettersData: Letter[] = [];
      (await getGmailMessages(messageIds, client, 'METADATA')).forEach((m) => {
        const letter = messageFromGmail(m);
        if (!lettersData.some((l) => l.from.email === letter.from.email))
          lettersData.push(letter);
      });
      res.status(200).json(lettersData.map((l) => l.toJSON()));
      logger.info(`Fetched ${letters.length} letters for ${user}.`);
    } catch (e) {
      handle(e, res);
    }
  }
}
