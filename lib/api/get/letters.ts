import Bottleneck from 'bottleneck';

import { Letter } from 'lib/model/letter';
import { User } from 'lib/model/user';
import getMessage from 'lib/api/get/message';
import gmail from 'lib/api/gmail';

export default async function getLetters(user: User): Promise<Letter[]> {
  const client = gmail(user.token);
  const { data } = await client.users.messages.list({
    maxResults: 500,
    userId: 'me',
  });
  const messageIds = (data.messages || []).map((m) => m.id as string);
  const limiter = new Bottleneck({ maxConcurrent: 50, minTime: 500 });
  const messages = await Promise.all(
    messageIds.map((id) => limiter.schedule(getMessage, id, user.token))
  );
  const letters: Letter[] = [];
  messages.forEach((m) => {
    const ltr = m.letter;
    if (!ltr) return;
    if (!letters.some((l) => l.from.toLowerCase() === ltr.from.toLowerCase()))
      letters.push(ltr);
  });
  return letters;
}
