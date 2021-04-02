import { User } from 'lib/model/user';
import gmail from 'lib/api/gmail';

export default async function createLabel(user: User): Promise<string> {
  const client = gmail(user.token);
  const { data } = await client.users.labels.create({
    userId: 'me',
    requestBody: {
      name: 'Return of the Newsletter',
      labelListVisibility: 'LABEL_SHOW',
      messageListVisibility: 'SHOW',
    },
  });
  return data.id as string;
}
