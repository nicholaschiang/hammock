import { Filter, User } from 'lib/model/user';
import gmail from 'lib/api/gmail';

export default async function createFilter(
  user: User,
  filter: Filter
): Promise<Filter> {
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
