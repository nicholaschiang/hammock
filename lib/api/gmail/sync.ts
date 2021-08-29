import to from 'await-to-js';

import { SCOPES, User } from 'lib/model/user';
import { createMessage, getMessage } from 'lib/api/db/message';
import getGmailMessages from 'lib/api/get/gmail-messages';
import getQuery from 'lib/api/query';
import gmail from 'lib/api/gmail';
import logger from 'lib/api/logger';
import messageFromGmail from 'lib/api/message-from-gmail';

export default async function syncGmail(
  user: User,
  pageToken?: string
): Promise<string> {
  const usr = `${user.name} (${user.id})`;
  if (!user.subscriptions.length) {
    logger.warn(`Skipping sync for no subscriptions for ${usr}...`);
    return '';
  }
  if (!user.scopes.includes(SCOPES.MODIFY)) {
    logger.error(`Skipping sync for ${usr} without MODIFY scope...`);
    return '';
  }
  const client = gmail(user.token);
  logger.verbose(`Fetching messages for ${usr}...`);
  const { data } = await client.users.messages.list({
    q: getQuery(user),
    maxResults: 10,
    userId: 'me',
    pageToken,
  });
  const messageIds = (data.messages || []).map((m) => m.id as string);
  logger.verbose(`Processing ${messageIds.length} messages for ${usr}...`);
  const toSyncMessageIds: string[] = [];
  await Promise.all(
    messageIds.map(async (id) => {
      const [err] = await to(getMessage(id));
      if (err) toSyncMessageIds.push(id);
    })
  );
  logger.verbose(`Fetching ${toSyncMessageIds.length} messages for ${usr}...`);
  const gmailMessages = await getGmailMessages(toSyncMessageIds, client);
  logger.verbose(`Saving ${gmailMessages.length} messages for ${usr}...`);
  await Promise.all(
    gmailMessages.map(async (gmailMessage) => {
      const message = messageFromGmail(gmailMessage);
      message.user = user.id;
      await createMessage(message);
      logger.debug(`Saved ${message} to Firestore database.`);
    })
  );
  return data.nextPageToken || '';
}
