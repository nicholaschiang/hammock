import { Gmail, GmailMessage } from 'lib/api/gmail';
import { Format } from 'lib/model/message';
import logger from 'lib/api/logger';

/**
 * @param id - The Gmail-assigned ID of the message to fetch.
 * @param client - An authorized Gmail API client.
 * @param [format] - The format or amount of data that should be fetched.
 * Defaults to full (all message data and parsed payload field with content).
 * @see {@link https://developers.google.com/gmail/api/reference/rest/v1/Format}
 * @return The message from Gmail (wrapped in our data model).
 */
export default async function getGmailMessage(
  id: string,
  client: Gmail,
  format: Format = 'FULL'
): Promise<GmailMessage> {
  logger.debug(`Fetching message (${id})...`);
  return (await client.users.messages.get({ id, format, userId: 'me' })).data;
}
