import { Letter } from 'lib/model/letter';
import { User } from 'lib/model/user';
import getGmailMessages from 'lib/api/get/gmail-messages';
import gmail from 'lib/api/gmail';
import logger from 'lib/api/logger';

export default async function getLetters(user: User): Promise<Letter[]> {
  logger.verbose(`Fetching letters for ${user}...`);
  const client = gmail(user.token);
  const { data } = await client.users.messages.list({
    maxResults: 500,
    userId: 'me',
  });
  const messageIds = (data.messages || []).map((m) => m.id as string);
  const letters: Letter[] = [];
  (await getGmailMessages(messageIds, client)).forEach((m) => {
    const ltr = m.letter;
    if (!ltr) return;
    if (!letters.some((l) => l.from.toLowerCase() === ltr.from.toLowerCase()))
      letters.push(ltr);
  });
  return letters;
}
