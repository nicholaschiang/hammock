import axios from 'axios';
import to from 'await-to-js';

import { APIError } from 'lib/api/error';
import { Message } from 'lib/model/message';

/**
 * @param id - The Gmail-assigned ID of the message to fetch.
 * @param token - The user's OAuth token that we can use for authorization.
 * @return The message from Gmail (wrapped in our data model).
 */
export default async function getMessage(
  id: string,
  token: string
): Promise<Message> {
  const headers = { authorization: `Bearer ${token}` };
  const endpoint = 'https://gmail.googleapis.com/gmail/v1/users/me/messages';
  const [err, res] = await to(axios.get(`${endpoint}/${id}`, { headers }));
  if (err) {
    const msg = `${err.name} fetching message (${id}) from Gmail`;
    throw new APIError(`${msg}: ${err.message}`, 500);
  }
  return new Message(res?.data);
}
