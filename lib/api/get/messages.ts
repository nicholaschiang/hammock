import Bottleneck from 'bottleneck';

import { Message } from 'lib/model/message';
import { User } from 'lib/model/user';
import getMessage from 'lib/api/get/message';
import gmail from 'lib/api/gmail';

export default async function getMessages(user: User): Promise<Message[]> {
  const client = gmail(user.token);
  const { data } = await client.users.messages.list({
    labelIds: [user.label],
    maxResults: 30,
    userId: 'me',
  });
  const messageIds = (data.messages || []).map((m) => m.id as string);
  const limiter = new Bottleneck({ maxConcurrent: 50, minTime: 500 });
  return Promise.all(
    messageIds.map((id) => limiter.schedule(getMessage, id, user.token))
  );
}
