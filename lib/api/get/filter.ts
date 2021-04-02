import { dequal } from 'dequal';

import { Filter, User } from 'lib/model/user';
import gmail from 'lib/api/gmail';
import logger from 'lib/api/logger';

export default async function getOrCreateFilter(
  user: User,
  from: string
): Promise<Filter> {
  const client = gmail(user.token);
  const requestBody = {
    action: { addLabelIds: [user.label], removeLabelIds: ['INBOX'] },
    criteria: { from },
  };

  logger.verbose(`Fetching filter (${from}) for ${user}...`);
  const { data: filters } = await client.users.settings.filters.list({
    userId: 'me',
  });
  const existing = filters.filter?.find((filter) =>
    dequal(requestBody, {
      action: filter.action,
      criteria: filter.criteria,
    })
  );
  if (existing?.id) return { id: existing.id, from };

  logger.verbose(`Creating filter (${from}) for ${user}...`);
  const { data: filter } = await client.users.settings.filters.create({
    requestBody,
    userId: 'me',
  });
  return { id: filter.id as string, from };
}
