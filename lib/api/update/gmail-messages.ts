import gmail, { Gmail } from 'lib/api/gmail';
import { User } from 'lib/model/user';
import logger from 'lib/api/logger';

async function removeLabels(user: User, client: Gmail): Promise<void> {
  logger.info(`Removing labels for ${user}...`);
  console.time('remove-labels');
  const { data } = await client.users.messages.list({
    q: `-from:(${user.subscriptions.join(' OR ')})`,
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

/**
 * Filters the user's Gmail messages into our "Hammock" label
 * based on their most up-to-date filters:
 * 1. Removes the label from messages that are not from our specified senders.
 * 2. Adds the label to messages that are from our specified senders and do not
 *    yet have the label.
 * @todo Ensure that Gmail supports sending us 2500 messages (and doesn't have
 * a cap at e.g. 500 letters per request). If it does have a cap, we should use
 * the `nextPageToken` to fetch and update a total of 2500 messages.
 */
async function addLabels(user: User, client: Gmail): Promise<void> {
  logger.info(`Adding labels for ${user}...`);
  console.time('add-labels');
  const { data } = await client.users.messages.list({
    q: `from:(${user.subscriptions.join(' OR ')})`,
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

export default async function updateGmailMessages(user: User): Promise<void> {
  logger.info(`Updating Gmail messages for ${user}...`);
  console.time('update-gmail-messages');
  const client = gmail(user.token);
  await Promise.all([addLabels(user, client), removeLabels(user, client)]);
  console.timeEnd('update-gmail-messages');
}
