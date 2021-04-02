import { Message, MessageInterface } from 'lib/model/message';
import gmail from 'lib/api/gmail';

/**
 * @param id - The Gmail-assigned ID of the message to fetch.
 * @param token - The user's OAuth token that we can use for authorization.
 * @return The message from Gmail (wrapped in our data model).
 */
export default async function getMessage(
  id: string,
  token: string
): Promise<Message> {
  const client = gmail(token);
  const { data } = await client.users.messages.get({ id, userId: 'me' });
  return new Message(data as MessageInterface);
}
