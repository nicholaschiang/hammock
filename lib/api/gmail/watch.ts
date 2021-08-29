import { SCOPES, User } from 'lib/model/user';
import gmail from 'lib/api/gmail';
import logger from 'lib/api/logger';

export default async function watchGmail(user: User): Promise<void> {
  const usr = `${user.name} (${user.id})`;
  if (!user.scopes.includes(SCOPES.MODIFY)) {
    logger.error(`Skipping sync for ${usr} without MODIFY scope...`);
    return;
  }
  const client = gmail(user.token);
  logger.verbose(`Stopping Gmail watch for ${usr}...`);
  await client.users.stop({ userId: 'me' });
  logger.verbose(`Setting up Gmail watch for ${usr}...`);
  await client.users.watch({
    userId: 'me',
    requestBody: {
      topicName: process.env.TOPIC_NAME,
      labelIds: user.label ? [user.label] : undefined,
    },
  });
}
