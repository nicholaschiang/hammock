import { Filter, User } from 'lib/model/user';
import gmail from 'lib/api/gmail';
import logger from 'lib/api/logger';

export default async function createFilter(
  user: User,
  filter: Filter
): Promise<Filter> {
  logger.verbose(`Creating filter (${filter.from}) for ${user}...`);
  const client = gmail(user.token);
  const { data } = await client.users.settings.filters.create({
    userId: 'me',
    requestBody: {
      action: { addLabelIds: [user.label], removeLabelIds: ['INBOX'] },
      criteria: { from: filter.from },
    },
  });
  return { ...filter, id: data.id as string };
}
