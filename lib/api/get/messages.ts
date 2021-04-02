import axios from 'axios';
import to from 'await-to-js';
import url from 'url';

import { INBOX_SIZE } from 'lib/api/config';
import { APIError } from 'lib/api/error';
import { Message } from 'lib/model/message';
import getMessage from 'lib/api/get/message';
import getUser from 'lib/api/get/user';

interface MessageList {
  messages: { id: string }[];
}

export default async function getMessages(uid: string): Promise<Message[]> {
  const user = await getUser(uid);
  const endpoint = url.format({
    pathname: 'https://gmail.googleapis.com/gmail/v1/users/me/messages',
    query: {
      key: 'AIzaSyAPPb6uJ1hFBethuSZtX9MuVyFViuXAcd8',
      maxResults: INBOX_SIZE,
      labelIds: user.label,
    },
  });
  const headers = { authorization: `Bearer ${user.token}` };
  const [err, messageList] = await to(
    axios.get<MessageList>(endpoint, { headers })
  );
  if (err) {
    const msg = `${err.name} fetching message list for ${user.toString()}`;
    throw new APIError(`${msg}: ${err.message}`, 500);
  }
  if (!messageList?.data.messages) return [];

  // TODO: Kunal included a rate limit here. Perhaps I should as well using
  // something like `tiny-async-pool` or another pre-built solution.
  const messageIds = messageList.data.messages.map((m) => m.id);
  return Promise.all(messageIds.map((id) => getMessage(id, user.token)));
}
