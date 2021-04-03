import { User } from 'lib/model/user';
import gmail from 'lib/api/gmail';

/**
 * Filters the user's Gmail messages into our "Return of the Newsletter" label
 * based on their most up-to-date filters:
 * 1. Removes the label from messages that are not from our specified senders.
 * 2. Adds the label to messages that are from our specified senders and do not
 *    yet have the label.
 * @todo Implement the removal process using "Doesn't have" Gmail filters:
 * @example label:tutorbook -{from:team@tutorbook.org}
 */
export default async function updateGmailMessages(user: User): Promise<void> {
  console.time('filter-messages');
  const client = gmail(user.token);
  const { data } = await client.users.messages.list({
    q: `from:(${user.filter.senders.join(' OR ')})`,
    maxResults: 1000,
    userId: 'me',
  });
  await client.users.messages.batchModify({
    requestBody: {
      ids: (data.messages || []).map((m) => m.id as string),
      addLabelIds: [user.label],
      removeLabelIds: ['INBOX'],
    },
    userId: 'me',
  });
  console.timeEnd('filter-messages');
}
