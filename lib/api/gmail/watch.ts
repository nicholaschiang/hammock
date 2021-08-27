import { SCOPES, User } from 'lib/model/user';
import { createMessage, deleteMessage } from 'lib/api/db/message';
import gmail from 'lib/api/gmail';
import logger from 'lib/api/logger';
import messageFromGmail from 'lib/api/message-from-gmail';

export default async function watchGmail(user: User): Promise<void> {
  if (!user.scopes.includes(SCOPES.READ)) {
    logger.error(
      `Skipping sync for ${user.name} (${user.id}) without READ scope...`
    );
    return;
  }
  const client = gmail(user.token);
  logger.verbose(`Setting up Gmail watch for ${user.name} (${user.id})...`);
  const { data: watch } = await client.users.watch({
    userId: 'me',
    requestBody: { topicName: process.env.TOPIC_NAME },
  });
  logger.verbose(`Fetching Gmail history for ${user.name} (${user.id})...`);
  const { data: history } = await client.users.history.list({
    historyTypes: ['messageAdded', 'messageDeleted'],
    startHistoryId: watch.historyId || '',
    maxResults: 500,
    userId: 'me',
  });
  logger.verbose(`Processing Gmail history for ${user.name} (${user.id})...`);
  await Promise.all(
    (history.history || []).map(async ({ messagesAdded, messagesDeleted }) => {
      const added = (messagesAdded || []).map((m) => m.message);
      const deleted = (messagesDeleted || []).map((m) => m.message);
      await Promise.all(
        added.map(async (m) => {
          if (m) await createMessage(messageFromGmail(m));
        })
      );
      await Promise.all(
        deleted.map(async (m) => {
          if (m?.id) await deleteMessage(m.id);
        })
      );
    })
  );
}
