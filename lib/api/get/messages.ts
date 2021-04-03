import { Message } from 'lib/model/message';
import { User } from 'lib/model/user';
import getGmailMessages from 'lib/api/get/gmail-messages';
import gmail from 'lib/api/gmail';
import logger from 'lib/api/logger';

export default async function getMessages(
  user: User,
  pageToken?: string
): Promise<{ messages: Message[]; nextPageToken: string }> {
  logger.verbose(`Fetching messages for ${user}...`);
  const client = gmail(user.token);
  const { data } = await client.users.messages.list({
    labelIds: [user.label],
    maxResults: 10,
    userId: 'me',
    pageToken,
  });
  const messageIds = (data.messages || []).map((m) => m.id as string);
  const messages = await getGmailMessages(messageIds, client);
  return { messages, nextPageToken: data.nextPageToken as string };
}
