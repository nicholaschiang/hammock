import { dequal } from 'dequal';

import { User } from 'lib/model/user';
import gmail from 'lib/api/gmail';
import logger from 'lib/api/logger';

export default async function getOrCreateFilter(user: User): Promise<string> {
  const client = gmail(user.token);
  const requestBody = {
    action: { addLabelIds: [user.label], removeLabelIds: ['INBOX'] },
    criteria: { from: user.subscriptions.join(' OR ') },
  };

  logger.verbose(`Fetching filters for ${user}...`);
  const { data } = await client.users.settings.filters.list({ userId: 'me' });
  const existing = data.filter?.find((f) =>
    dequal(requestBody, { action: f.action, criteria: f.criteria })
  );
  if (existing?.id) return existing.id;

  logger.verbose(`Deleting old filters for ${user}...`);
  await Promise.all(
    (data.filter || [])
      .filter((f) => f.action?.addLabelIds?.includes(user.label))
      .map((f) =>
        client.users.settings.filters.delete({
          id: f.id || '',
          userId: 'me',
        })
      )
  );

  if (!requestBody.criteria.from) return user.filter;

  logger.verbose(`Creating filter for ${user}...`);
  const { data: filter } = await client.users.settings.filters.create({
    requestBody,
    userId: 'me',
  });
  return filter.id || '';
}
