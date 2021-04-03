import Bottleneck from 'bottleneck';

import { Message } from 'lib/model/message';
import { Gmail } from 'lib/api/gmail';
import getMessage from 'lib/api/get/message';
import logger from 'lib/api/logger';

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
  console.time('get-gmail-messages');
  logger.verbose(`Fetching ${messageIds.length} messages from Gmail...`);
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
  console.timeEnd('get-gmail-messages');
  return messages;
}
