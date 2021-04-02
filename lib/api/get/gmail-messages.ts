import Bottleneck from 'bottleneck';

import { Message, MessageInterface } from 'lib/model/message';
import { Gmail } from 'lib/api/gmail';
import logger from 'lib/api/logger';

/**
 * @param id - The Gmail-assigned ID of the message to fetch.
 * @param client - An authorized Gmail API client.
 * @return The message from Gmail (wrapped in our data model).
 */
async function getMessage(id: string, client: Gmail): Promise<Message> {
  logger.debug(`Fetching message (${id})...`);
  const { data } = await client.users.messages.get({ id, userId: 'me' });
  return new Message(data as MessageInterface);
}

/**
 * Fetches the requested messages from Gmail in the fastest way possible while
 * following rate limits and retrying failed requests.
 *
 * Rate limit for Gmail's API is 250 quota units per second per user. Each
 * `messages.get` request consumes 5 quota units. Thus, I have to limit requests
 * to 250/5 = 50 per second.
 * @see {@link https://developers.google.com/gmail/api/reference/quota}
 *
 * @param messageIds - The IDs of the messages to fetch (from `messages.list`).
 * @param client - An authorized Gmail API client.
 * @return Promise that resolves to an array of messages.
 */
export default async function getGmailMessages(
  messageIds: string[],
  client: Gmail
): Promise<Message[]> {
  logger.verbose(`Fetching ${messageIds.length} messages from Gmail...`);
  console.time('messages');
  const limiter = new Bottleneck({
    reservoir: 250 / 5,
    reservoirRefreshAmount: 250 / 5,
    reservoirRefreshInterval: 1000,
    maxConcurrent: 250 / 5,
    minTime: 5,
  });
  const messages = await Promise.all(
    messageIds.map((id) => limiter.schedule(getMessage, id, client))
  );
  console.timeEnd('messages');
  return messages;
}
