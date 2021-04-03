import { Message, MessageInterface } from 'lib/model/message';
import { Gmail } from 'lib/api/gmail';
import logger from 'lib/api/logger';

/**
 * @param id - The Gmail-assigned ID of the message to fetch.
 * @param client - An authorized Gmail API client.
 * @return The message from Gmail (wrapped in our data model).
 */
export default async function getMessage(
  id: string,
  client: Gmail
): Promise<Message> {
  logger.debug(`Fetching message (${id})...`);
  const { data } = await client.users.messages.get({ id, userId: 'me' });
  return new Message(data as MessageInterface);
}
