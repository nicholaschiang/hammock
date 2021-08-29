import { SCOPES, User } from 'lib/model/user';
import { Gmail } from 'lib/api/gmail';
import getQuery from 'lib/api/query';
import logger from 'lib/api/logger';

export async function removeLabels(user: User, client: Gmail): Promise<void> {
  const usr = `${user.name} (${user.id})`;
  if (!user.scopes.includes(SCOPES.MODIFY)) {
    logger.error(`Skipping labeling for ${usr} without MODIFY scope...`);
    return;
  }
  console.time('remove-labels');
  logger.info(`Removing labels for ${usr}...`);
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
  const usr = `${user.name} (${user.id})`;
  if (!user.scopes.includes(SCOPES.MODIFY)) {
    logger.error(`Skipping labeling for ${usr} without MODIFY scope...`);
    return;
  }
  console.time('add-labels');
  logger.info(`Adding labels for ${user}...`);
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
