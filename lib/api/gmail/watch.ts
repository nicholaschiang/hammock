import { SCOPES, User } from 'lib/model/user';
import gmail from 'lib/api/gmail';
import logger from 'lib/api/logger';

export default async function watchGmail(user: User): Promise<void> {
  if (!user.scopes.includes(SCOPES.READ)) {
    logger.error(
      `Skipping sync for ${user.name} (${user.id}) without READ scope...`
    );
    return;
  }
  const client = gmail(user.token);
  logger.verbose(`Setting up Gmail watch for ${user.name} (${user.id})...`);
  await client.users.watch({
    userId: 'me',
    requestBody: {
      topicName: process.env.TOPIC_NAME,
      labelIds: user.label ? [user.label] : undefined,
    },
  });
}
