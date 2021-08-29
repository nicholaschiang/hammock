import { Gmail } from 'lib/api/gmail';
import { User } from 'lib/model/user';
import getQuery from 'lib/api/query';
import logger from 'lib/api/logger';

export async function removeLabels(user: User, client: Gmail): Promise<void> {
  logger.info(`Removing labels for ${user}...`);
  console.time('remove-labels');
  const { data } = await client.users.messages.list({
    q: `-from:(${user.subscriptions.map((s) => s.email).join(' OR ')})`,
    labelIds: [user.label],
    maxResults: 2500,
    userId: 'me',
  });
  if (data.messages?.length)
    await client.users.messages.batchModify({
      requestBody: {
        ids: data.messages.map((m) => m.id as string),
        removeLabelIds: [user.label],
      },
      userId: 'me',
    });
  console.timeEnd('remove-labels');
}

export async function addLabels(user: User, client: Gmail): Promise<void> {
  logger.info(`Adding labels for ${user}...`);
  console.time('add-labels');
  const { data } = await client.users.messages.list({
    q: getQuery(user),
    maxResults: 2500,
    userId: 'me',
  });
  if (data.messages?.length)
    await client.users.messages.batchModify({
      requestBody: {
        ids: data.messages.map((m) => m.id as string),
        addLabelIds: [user.label],
        removeLabelIds: ['INBOX'],
      },
      userId: 'me',
    });
  console.timeEnd('add-labels');
}
