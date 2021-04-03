import { User } from 'lib/model/user';
import gmail from 'lib/api/gmail';

export default async function retroactivelyFilterMessages(
  user: User
): Promise<void> {
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
