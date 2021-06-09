import { User } from 'lib/model/user';
import { db } from 'lib/api/firebase';
import getGmailMessages from 'lib/api/get/gmail-messages';
import gmail from 'lib/api/gmail';
import logger from 'lib/api/logger';
import messageFromGmail from 'lib/api/message-from-gmail';

/**
 * Syncs our database with the user's Gmail account:
 * 1. Calls `messages.list` with the user's specified newsletter filters to get
 *    all the past newsletter messages.
 * 2. If a message ID already exists in our database, we skip it.
 * 3. Otherwise, we fetch the full (`format=FULL`) message data, parse it, and
 *    add the sanitized data model to our database.
 *
 * Rate limit for Gmail's API is 250 quota units per second per user. Each
 * `messages.get` request consumes 5 quota units. Thus, I have to limit requests
 * to 250/5 = 50 per second.
 * @see {@link https://developers.google.com/gmail/api/reference/quota}
 *
 * @return {string} - The next page token (call `syncGmail` again with that
 * token to sync the next 10 messages).
 */
export default async function syncGmail(
  user: User,
  pageToken?: string
): Promise<string> {
  const client = gmail(user.token);

  logger.verbose(`Fetching messages for ${user}...`);
  const { data } = await client.users.messages.list({
    q: `from:(${user.subscriptions.map((s) => s.from.email).join(' OR ')})`,
    maxResults: 10,
    userId: 'me',
    pageToken,
  });
  const messageIds = (data.messages || []).map((m) => m.id as string);

  logger.verbose(`Processing ${messageIds.length} messages for ${user}...`);
  const toSyncMessageIds: string[] = [];
  await Promise.all(
    messageIds.map(async (id) => {
      const ref = db
        .collection('users')
        .doc(user.id)
        .collection('messages')
        .doc(id);
      const doc = await ref.get();
      if (!doc.exists) toSyncMessageIds.push(id);
    })
  );

  logger.verbose(`Fetching ${toSyncMessageIds.length} messages for ${user}...`);
  const gmailMessages = await getGmailMessages(toSyncMessageIds, client);

  logger.verbose(`Saving ${gmailMessages.length} messages for ${user}...`);
  await Promise.all(
    gmailMessages.map(async (gmailMessage, idx) => {
      const message = messageFromGmail(gmailMessage);
      const ref = db
        .collection('users')
        .doc(user.id)
        .collection('messages')
        .doc(gmailMessage.id || toSyncMessageIds[idx]);
      await ref.set(message.toFirestore());
      logger.debug(`Saved ${message} to Firestore database.`);
    })
  );

  return data.nextPageToken || '';
}
