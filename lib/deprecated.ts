import queryString from 'query-string';
import _ from 'lodash';

import { Message } from 'lib/model/message';
import { Newsletter, isNewsletter } from 'lib/newsletter';

const INBOX_SIZE = 30;
const NEWSLETTERS_SIZE = 400;
const MOVE_LABELS_SIZE = 100;
const MESSAGE_BATCH_SIZE = 50;
const MESSAGE_SLEEP_TIME = 500;

export async function fetchInboxMessages(
  token: string,
  labelId: string,
  pageToken: string | null
): Promise<[Message[], string | null]> {
  const query = { maxResults: INBOX_SIZE, labelIds: labelId };
  if (pageToken != null) query['pageToken'] = pageToken;
  const messageList = await get(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages',
    token,
    query
  );
  if (!messageList.messages) return [[], null];
  const messageIds: string[] = messageList.messages.map((m) => m.id);
  const nextPageToken = messageList.nextPageToken;
  const messages = await getMessages(messageIds, token);
  return [messages, nextPageToken];
}

export async function fetchNewsletters(token: string): Promise<Newsletter[]> {
  const messageList = await get(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages',
    token,
    {
      maxResults: NEWSLETTERS_SIZE,
    }
  );
  if (!messageList.messages) return [];
  const messageIds: string[] = messageList.messages.map((m) => m.id);
  console.log(messageIds.length);
  const messages = await getMessages(messageIds, token);

  const newsletters: Newsletter[] = [];
  messages.forEach((m) => {
    const nl = isNewsletter(m);
    if (nl !== false) newsletters.push(nl);
    if (nl == false) console.log('Rejected', nl, m.id);
  });
  console.log(newsletters);
  return _.uniqBy(newsletters, (n) => n.from.toLowerCase());
}

export async function createLabel(
  token: string,
  name: string
): Promise<string> {
  const label = await post(
    'https://gmail.googleapis.com/gmail/v1/users/me/labels',
    token,
    {
      name: name,
      messageListVisibility: 'SHOW',
      labelListVisibility: 'LABEL_SHOW',
    }
  );
  console.log(label);
  return label.id as string;
}

export async function createFilter(
  token: string,
  labelId: string,
  from: string
): Promise<string> {
  const filter = await post(
    'https://gmail.googleapis.com/gmail/v1/users/me/settings/filters',
    token,
    {
      criteria: {
        from: from,
      },
      action: {
        addLabelIds: [labelId],
        removeLabelIds: ['INBOX'],
      },
    }
  );
  console.log(filter);

  // Retroactively move old messages to the filter.
  const retroactiveMessageList = await get(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages',
    token,
    {
      maxResults: MOVE_LABELS_SIZE,
      q: 'from:' + from,
    }
  );
  await post(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/batchModify',
    token,
    {
      ids: retroactiveMessageList.messages.map((m) => m.id),
      addLabelIds: [labelId],
      removeLabelIds: ['INBOX'],
    }
  );

  return filter.id as string;
}

async function getMessages(ids: string[], token: string): Promise<Message[]> {
  const allResults = [];
  const batches = _.chunk(ids, MESSAGE_BATCH_SIZE);
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const results = await Promise.all(batch.map((id) => getMessage(id, token)));
    allResults.push(...results);
    if (i < batches.length - 1) await sleep(MESSAGE_SLEEP_TIME);
  }
  return allResults;
}

async function getMessage(id: string, token: string): Promise<Message> {
  return await get(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/' + id,
    token,
    {}
  );
}

async function get(url: string, token: string, query) {
  query.key = 'AIzaSyAPPb6uJ1hFBethuSZtX9MuVyFViuXAcd8';
  const resp = await fetch(url + '?' + queryString.stringify(query), {
    method: 'GET',
    headers: { Authorization: 'Bearer ' + token },
  });
  return await resp.json();
}

async function post(url: string, token: string, body) {
  const resp = await fetch(
    url + '?key=AIzaSyAPPb6uJ1hFBethuSZtX9MuVyFViuXAcd8',
    {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );
  if (resp.status === 204) return null;
  return await resp.json();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const reFrom = /(.*) <(.*)>/;
export function parseFrom(from: string): { name: string; email: string } {
  const matches = from.match(reFrom);
  if (!matches) {
    console.log('Parse From - No Matches for: ', from);
    return { name: from, email: from };
  }
  let name = matches[1].trim();
  if (name.startsWith('"')) {
    name = name.substr(1);
  }
  if (name.endsWith('"')) {
    name = name.substr(0, name.length - 1);
  }
  return { name: name, email: matches[2] };
}

export function getHeader(
  message: Message,
  header: string
): string | undefined {
  return message.payload.headers.find((h) => h.name.toLowerCase() === header)
    ?.value;
}
