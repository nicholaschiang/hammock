import { User } from 'lib/model/user';
import gmail from 'lib/api/gmail';
import logger from 'lib/api/logger';

const LABEL_NAME = 'Hammock';

export default async function getOrCreateLabel(user: User): Promise<string> {
  const client = gmail(user.token);

  logger.verbose(`Fetching label for ${user}...`);
  const { data: labels } = await client.users.labels.list({ userId: 'me' });
  const existing = labels.labels?.find((l) => l.name === LABEL_NAME);
  if (existing?.id) return existing.id;

  logger.verbose(`Creating label for ${user}...`);
  const { data: label } = await client.users.labels.create({
    userId: 'me',
    requestBody: {
      labelListVisibility: 'LABEL_SHOW',
      messageListVisibility: 'SHOW',
      name: LABEL_NAME,
    },
  });
  return label.id as string;
}
