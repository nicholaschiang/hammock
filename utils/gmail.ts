import queryString from 'query-string'
import _ from 'lodash';
import { Newsletter, isNewsletter } from './newsletter'

const INBOX_SIZE = 25;
const NEWSLETTERS_SIZE = 100;
const MOVE_LABELS_SIZE = 100;
const MESSAGE_BATCH_SIZE = 50;
const MESSAGE_SLEEP_TIME = 1000;

export async function fetchInboxMessages(token: string, labelId: string, pageToken: string | null): Promise<[Message[], string | null]> {
  const query = { maxResults: INBOX_SIZE, labelIds: labelId };
  if (pageToken != null) query['pageToken'] = pageToken;
  const messageList = await get('https://gmail.googleapis.com/gmail/v1/users/me/messages', token, query);
  if (!messageList.messages) return [[], null]
  const messageIds: string[] = messageList.messages.map(m => m.id);
  const nextPageToken = messageList.pageToken;
  const messages = await getMessages(messageIds, token);
  console.log(messages[0]);
  return [messages, nextPageToken]
}

export async function fetchNewsletters(token: string): Promise<Newsletter[]> {
  const messageList = await get('https://gmail.googleapis.com/gmail/v1/users/me/messages', token, {
    maxResults: NEWSLETTERS_SIZE,
    q: 'category:forums OR category:promotions',
  });
  if (!messageList.messages) return [];
  const messageIds: string[] = messageList.messages.map(m => m.id);
  console.log(messageIds.length);
  const messages = await getMessages(messageIds, token);

  const newsletters: Newsletter[] = [];
  messages.forEach(m => {
    const nl = isNewsletter(m);
    if (nl !== false) newsletters.push(nl);
    if (nl == false) console.log('Rejected', nl, m.id);
  })
  console.log(newsletters);
  return _.uniqBy(newsletters, n => n.from.toLowerCase());
}

export async function createLabel(token: string, name: string): Promise<string> {
  const label = await post('https://gmail.googleapis.com/gmail/v1/users/me/labels', token, {
    name: name,
    messageListVisibility: 'SHOW',
    labelListVisibility: 'LABEL_SHOW',
  });
  console.log(label);
  return label.id as string;
}

export async function createFilter(token: string, labelId: string, from: string): Promise<string> {
  const filter = await post('https://gmail.googleapis.com/gmail/v1/users/me/settings/filters', token, {
    criteria: {
      from: from,
    },
    action: {
      addLabelIds: [labelId],
      removeLabelIds: ['INBOX'],
    },
  });
  console.log(filter);

  // Retroactively move old messages to the filter.
  const retroactiveMessageList = await get('https://gmail.googleapis.com/gmail/v1/users/me/messages', token, {
    maxResults: MOVE_LABELS_SIZE,
    q: 'from:' + from,
  });
  await post('https://gmail.googleapis.com/gmail/v1/users/me/messages/batchModify', token, {
    ids: retroactiveMessageList.messages.map(m => m.id),
    addLabelIds: [labelId],
    removeLabelIds: ['INBOX'],
  });

  return filter.id as string;
}

async function getMessages(ids: string[], token: string) {
  const allResults = [];
  const batches = _.chunk(ids, MESSAGE_BATCH_SIZE);
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const results = await Promise.all(batch.map(id => getMessage(id, token)));
    allResults.push(...results);
    if (i < batches.length - 1) await sleep(MESSAGE_SLEEP_TIME);
  }
  return allResults;
}

export type Message = {
  id: string,
  labelIds: string[],
  snippet: string,
  internalDate: string,
  payload: {
    mimeType: string,
    body: {
      data: string,
    }
    headers: {
      name: string,
      value: string,
    }[],
    parts: {
      mimeType: string,
      body: {
        data: string,
      }
    }[],
  }
}

export const exampleMessage1 = {
  id: '1234',
  labelIds: [],
  snippet: 'If you&#39;re a creator, you might have heard that NFTs are selling for tens of thousands of dollars. In this post, I&#39;ll explain what NFTs are and how you can create one to let your fans own your',
  payload: {
    headers: [
      {name: 'Subject', value: 'A Step by Step Guide to NFTs for Creators'},
      {name: 'From', value: 'Peter <peteryang@substack.com>'},
    ],
    parts: [],
  },
  internalDate: "1613682180000",
}

export const exampleMessage2 = {
  id: '1235',
  labelIds: [],
  snippet: 'If you&#39;ve been busy lately, here are some of the most popular stories that we have published recently. \u200c \u200c \u200c Don&#39;t Miss These Trending Stories Here are some of the most popular stories that we',
  payload: {
    headers: [
      {name: 'Subject', value: 'This Week\'s Trending Stories.'},
      {name: 'From', value: 'Jessica Lessin <hello@theinformation.com>'},
    ],
    parts: [],
  },
  internalDate: "1612672080000",
}

async function getMessage(id: string, token: string) {
  return await get('https://gmail.googleapis.com/gmail/v1/users/me/messages/' + id, token, {});
}

async function get(url: string, token: string, query) {
  query.key = 'AIzaSyAPPb6uJ1hFBethuSZtX9MuVyFViuXAcd8';
  const resp = await fetch(url + '?' + queryString.stringify(query), {
    method: 'GET',
    headers: { 'Authorization': 'Bearer ' + token },
  });
  return await resp.json();
}

async function post(url: string, token: string, body) {
  const resp = await fetch(url + '?key=AIzaSyAPPb6uJ1hFBethuSZtX9MuVyFViuXAcd8', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (resp.status === 204) return null;
  return await resp.json();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const reFrom = /(.*) <(.*)>/
export function parseFrom(from: string): { name: string, email: string } {
  const matches = from.match(reFrom);
  if (!matches) {
    console.log('Parse From - No Matches for: ', from);
    return { name: from, email: from };
  }
  let name = matches[1].trim();
  if (name.startsWith("\"")) {
    name = name.substr(1);
  }
  if (name.endsWith("\"")) {
    name = name.substr(0, name.length - 1);
  }
  return { name: name, email: matches[2] }
}

export function getHeader(message: Message, header: string): string | null {
  const h = message.payload.headers.find(h => h.name.toLowerCase() === header);
  if (!h) return null;
  return h.value
}

const goodDomains = [
  'substack.com',
]

export const exampleMessage3 =
{
  "id": "177a315bc8cbad60",
  "threadId": "177a315bc8cbad60",
  "labelIds": [
    "CATEGORY_PROMOTIONS",
    "IMPORTANT",
    "INBOX"
  ],
  "snippet": "Articles from the Experts + Free memberships It&#39;s been a weird year, Kunal, and Valentine&#39;s Day 2021 is no exception! We know how much dating has changed, so our team has been working on some",
  "payload": {
    "partId": "",
    "mimeType": "multipart/alternative",
    "filename": "",
    "headers": [
      {
        "name": "Delivered-To",
        "value": "kunalm@gmail.com"
      },
      {
        "name": "Received",
        "value": "by 2002:a05:6a10:2b1:0:0:0:0 with SMTP id 17csp5039686pxm;        Sun, 14 Feb 2021 16:27:27 -0800 (PST)"
      },
      {
        "name": "X-Google-Smtp-Source",
        "value": "ABdhPJzT398BUDItXOtGO+h4jfL6FH67W/iFPFR+BwZZXDz43guvyhAs6k73Hdgbth84c+hvUbYV"
      },
      {
        "name": "X-Received",
        "value": "by 2002:aca:5c87:: with SMTP id q129mr6908215oib.24.1613348846916;        Sun, 14 Feb 2021 16:27:26 -0800 (PST)"
      },
      {
        "name": "ARC-Seal",
        "value": "i=1; a=rsa-sha256; t=1613348846; cv=none;        d=google.com; s=arc-20160816;        b=vJg+VTLKPjQoN+gNVdfTNLSz6KljAP1I5RUzGwJRX984uSQtUqxXkXK4qDszc8YWU5         hHiOHdvU6Qw9tvaNQ0ZEjABJYou1KEUf6XifAImUZi+o6VWPXMH0M/mcyOTbI2QWJ9Ol         BPERTsqJjLT8PQuIMRwDAJGwBd7rpzFFvGLihMpJe7gqt3c4zkGdmzMu8/aUup3do4ls         mV6g0sgxF3rI1MvckScSZHrskN9PMfrDaBsZQqINV55zKn1+eRUGyIV4haeqLBBgXq9x         PuUSBlOIjyQu5ZsKpWqdMMpf0IroPjYYeoc9ByLExhF7Vki0tqmBOHDHYdgqGZzdC2WS         8vrA=="
      },
      {
        "name": "ARC-Message-Signature",
        "value": "i=1; a=rsa-sha256; c=relaxed/relaxed; d=google.com; s=arc-20160816;        h=feedback-id:message-id:list-id:reply-to:mime-version         :list-unsubscribe:date:subject:to:from:dkim-signature;        bh=AOlrdEPBBRu5UHsUb83AB0YjPlDmMKRIJLRx+QKiXSw=;        b=gg6YPOfH/e0aPgvTbZ+IamGFUjMIAPHLZB/5ydMloI3xukLazHU8Jr0PgH8t3EEtJn         Tqr8xtRt7V7NafTQ8fpM0W9btLpBTD8h0ADUWZSD7uUGMJu/2/9aeXVgypW1wkp7obxt         waLA/4p9dwgKk8f/PRbelF782EBRDWrIwgWKTNe6/sypflqat+en/9DzdSNkbYLul2Il         1gYIDw4Ir5XFLQgH6rMR2ktasWqY57ltcelq+kTXq8N939L/d464/BZS82JlzbwMmjlS         YJ4Z9je4HJEMguoyEoVh9f7L1aCjH1aBozRZ5c3LpNj5At1gqFe9oUs5G4tUQv6ZfPPY         e7eA=="
      },
      {
        "name": "ARC-Authentication-Results",
        "value": "i=1; mx.google.com;       dkim=pass header.i=@communications.tawkify.com header.s=10dkim1 header.b=OvB6gcbV;       spf=pass (google.com: domain of bounce-152_html-52698124-186546-100026760-15004@bounce.communications.tawkify.com designates 13.111.125.1 as permitted sender) smtp.mailfrom=bounce-152_HTML-52698124-186546-100026760-15004@bounce.communications.tawkify.com;       dmarc=pass (p=NONE sp=NONE dis=NONE) header.from=tawkify.com"
      },
      {
        "name": "Return-Path",
        "value": "\u003cbounce-152_HTML-52698124-186546-100026760-15004@bounce.communications.tawkify.com\u003e"
      },
      {
        "name": "Received",
        "value": "from mta.communications.tawkify.com (mta.communications.tawkify.com. [13.111.125.1])        by mx.google.com with ESMTPS id o9si9618600oik.107.2021.02.14.16.27.26        for \u003ckunalm@gmail.com\u003e        (version=TLS1_2 cipher=ECDHE-ECDSA-AES128-GCM-SHA256 bits=128/128);        Sun, 14 Feb 2021 16:27:26 -0800 (PST)"
      },
      {
        "name": "Received-SPF",
        "value": "pass (google.com: domain of bounce-152_html-52698124-186546-100026760-15004@bounce.communications.tawkify.com designates 13.111.125.1 as permitted sender) client-ip=13.111.125.1;"
      },
      {
        "name": "Authentication-Results",
        "value": "mx.google.com;       dkim=pass header.i=@communications.tawkify.com header.s=10dkim1 header.b=OvB6gcbV;       spf=pass (google.com: domain of bounce-152_html-52698124-186546-100026760-15004@bounce.communications.tawkify.com designates 13.111.125.1 as permitted sender) smtp.mailfrom=bounce-152_HTML-52698124-186546-100026760-15004@bounce.communications.tawkify.com;       dmarc=pass (p=NONE sp=NONE dis=NONE) header.from=tawkify.com"
      },
      {
        "name": "DKIM-Signature",
        "value": "v=1; a=rsa-sha256; c=relaxed/relaxed; s=10dkim1; d=communications.tawkify.com; h=From:To:Subject:Date:List-Unsubscribe:MIME-Version:Reply-To:List-ID: X-CSA-Complaints:Message-ID:Content-Type; i=emma@communications.tawkify.com; bh=AOlrdEPBBRu5UHsUb83AB0YjPlDmMKRIJLRx+QKiXSw=; b=OvB6gcbVnTzlLKi7GeRobWCwI3aeEfKC90++cWZNiXat1uKfVxoWu/qsCXLjI8t1dOJ91Z+I6w8x   wHe9hxd7nMVn9ALxQ6y5jOuwx+PqcV3Fh2ZEURGgUfAE0Fa/qTUyX3fmE9uXFiYNKQyD9PQPjWzn   p8OMhBYRe/6nINPoRJZjJb6KNPWJ8P/8OdyBfTg4aLQTUnHJ/Po03vSAHjzJj6xMu7/oBMnqKT/K   C3X4rUF8miEkj34H9M54MmAA3sS2/TlpkkDOztYMOVVQhFxh35S682LKpxDZEpsLlCXjYq8x8HlW   O7e/uWom8dr4h6zsIzxpyg5vcI72ndowCC3ogA=="
      },
      {
        "name": "Received",
        "value": "by mta.communications.tawkify.com id h56vus2fmd4t for \u003ckunalm@gmail.com\u003e; Mon, 15 Feb 2021 00:26:47 +0000 (envelope-from \u003cbounce-152_HTML-52698124-186546-100026760-15004@bounce.communications.tawkify.com\u003e)"
      },
      {
        "name": "From",
        "value": "Emma at Tawkify \u003cemma@communications.tawkify.com\u003e"
      },
      {
        "name": "To",
        "value": "\u003ckunalm@gmail.com\u003e"
      },
      {
        "name": "Subject",
        "value": "Valentine's Day 2021"
      },
      {
        "name": "Date",
        "value": "Sun, 14 Feb 2021 18:26:47 -0600"
      },
      {
        "name": "List-Unsubscribe",
        "value": "\u003cmailto:leave-fd531575770b5c392848-fe5a1172736d0c7c7710-fec115787361007b-fe3915707564067b721270-ff051575756400@leave.communications.tawkify.com\u003e"
      },
      {
        "name": "MIME-Version",
        "value": "1.0"
      },
      {
        "name": "Reply-To",
        "value": "Emma at Tawkify \u003creply-fec115787361007b-152_HTML-52698124-100026760-15004@communications.tawkify.com\u003e"
      },
      {
        "name": "List-ID",
        "value": "\u003c100026760.xt.local\u003e"
      },
      {
        "name": "X-CSA-Complaints",
        "value": "csa-complaints@eco.de"
      },
      {
        "name": "X-SFMC-Stack",
        "value": "10"
      },
      {
        "name": "x-job",
        "value": "100026760_186546"
      },
      {
        "name": "Message-ID",
        "value": "\u003cbbf1a1e6-9b85-4aab-8a70-cd7e19257e11@dfw1s10mta823.xt.local\u003e"
      },
      {
        "name": "Feedback-ID",
        "value": "100026760:186546:13.111.125.1:sfmktgcld"
      },
      {
        "name": "Content-Type",
        "value": "multipart/alternative; boundary=\"j7Zn0Hn403Ix=_?:\""
      }
    ],
    "body": {
      "size": 0
    },
    "parts": [
      {
        "partId": "0",
        "mimeType": "text/plain",
        "filename": "",
        "headers": [
          {
            "name": "Content-Type",
            "value": "text/plain; charset=\"utf-8\""
          },
          {
            "name": "Content-Transfer-Encoding",
            "value": "8bit"
          }
        ],
        "body": {
          "size": 1195,
          "data": "SXQncyBiZWVuIGEgd2VpcmQgeWVhciwgS3VuYWwsIGFuZCBWYWxlbnRpbmUncyBEYXkgMjAyMSBpcyBubyBleGNlcHRpb24hwqBXZSBrbm93IGhvdyBtdWNoIGRhdGluZyBoYXMgY2hhbmdlZCwgc28gb3VyIHRlYW0gaGFzwqBiZWVuIHdvcmtpbmcgb24gc29tZSBuZXcgdGhpbmdzIHRvIGhlbHAgZXZlcnlvbmUgZGF0ZS1vbiB3aXRoIGNvbmZpZGVuY2UsIHdoYXRldmVyIGNvbWVzOg0KwqANClZpcnR1YWwgZGF0ZXJzLCB0aGlzIGlzIGEgdmlkZW8gZGF0ZSBkcmVzc2luZyBndWlkZSBmcm9tIG91ciBibG9nIHRlYW0gPGh0dHA6Ly9ibG9nLnRhd2tpZnkuY29tL2Jsb2ctdGF3a2lmeS8yMDIxLzEvMjcveW91ci1ndWlkZS10by1kcmVzc2luZy1mb3ItYS12aXJ0dWFsLWRhdGU-LCBhbmQgaGVyZSBpcyBhIGNhdGNoLWFsbCBhcnRpY2xlwqBmb3IgZGF0ZSBwbGFubmluZyBpbiAyMDIxIDxodHRwOi8vYmxvZy50YXdraWZ5LmNvbS9ibG9nLXRhd2tpZnkvMjAyMS8yLzE3L2NvdmlkLWNocm9uaWNsZXMtZGF0ZS1wbGFubmluZy1pbi0yMDIxPi4NCg0KQWxzbyBnb2luZyBvbiB0aGlzIG1vbnRoLCBvdXIgYW5udWFsIE1vbnRoIG9mIExvdmUgZXZlbnQuIEFsbCBGZWJydWFyeSBsb25nLMKgd2Ugb3BlbiBtYXRjaGFibGUgbWVtYmVyc2hpcCB0byB5b3UgYW5kIHRvIHRob3NlIHlvdSB0aGluayB3b3VsZCBiZSBhIGdvb2QgYWRkaXRpb24gdG8gdGhlIG5ldHdvcmsuIFRob3NlIHdobyBhY2NlcHQgdGhlIGludml0YXRpb24gYXJlIGFjdGl2YXRlZCBmb3IgYSB5ZWFyIG9mIHBvc3NpYmxlIG1hdGNoaW5nIHdpdGggVGF3a2lmeSBjbGllbnRzLsKgR2l2ZSB0byB5b3Vyc2VsZsKgd2l0aCB0aGlzIGxpbmsgPGh0dHBzOi8vdGF3a2lmeS5jb20vYWN0aXZhdGUvZnJlZV90cmlhbD9wcj1GUkVFTUVNQkVSVFJJQUw-LCB0aGVuIHNoYXJlIHdpdGggdGhpcyBvbmUgPGJsb2cudGF3a2lmeS5jb20vc2hhcmVhYmxlLWZyZWUtdGF3a2lmeS1tZW1iZXJzaGlwPi7CoA0KDQpXaGF0ZXZlciB5b3VyIHBsYW5zIGFyZSB0b25pZ2h0LCB3ZSBob3BlIHlvdSdyZSBkb2luZyBzb21ldGhpbmcgdGhhdCBtYWtlcyB5b3UgZmVlbCBsb3ZlZCAtIHdoZXRoZXIgdGhhdCdzIGEgZGlubmVyIGRhdGUsIGEgbW92aWUgbmlnaHQgd2l0aCBmcmllbmRzLCBvciBhIGJ1YmJsZSBiYXRoISBNdWNoIGxvdmUsIFlvdXIgVGF3a2lmeSBUZWFtDQoNCg=="
        }
      },
      {
        "partId": "1",
        "mimeType": "text/html",
        "filename": "",
        "headers": [
          {
            "name": "Content-Type",
            "value": "text/html; charset=\"utf-8\""
          },
          {
            "name": "Content-Transfer-Encoding",
            "value": "8bit"
          }
        ],
        "body": {
          "size": 23530,
          "data": "PCFET0NUWVBFIEhUTUwgUFVCTElDICItLy9XM0MvL0RURCBIVE1MIDQuMDEgVHJhbnNpdGlvbmFsLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL1RSL2h0bWw0L2xvb3NlLmR0ZCI-DQo8aHRtbD4NCiAgPGhlYWQ-DQogICAgPG1ldGEgbmFtZT0idmlld3BvcnQiIGNvbnRlbnQ9IndpZHRoPWRldmljZS13aWR0aCwgaW5pdGlhbC1zY2FsZT0xLCBtYXhpbXVtLXNjYWxlPTEsIHVzZXItc2NhbGFibGU9MCI-DQogICAgPG1ldGEgaHR0cC1lcXVpdj0iQ29udGVudC1UeXBlIiBjb250ZW50PSJ0ZXh0L2h0bWw7IGNoYXJzZXQ9VVRGLTgiPg0KICAgIDxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI-DQogICAgICBSZWFkTXNnQm9keXsgd2lkdGg6IDEwMCU7fQ0KICAgICAgLkV4dGVybmFsQ2xhc3Mge3dpZHRoOiAxMDAlO30NCiAgICAgIC5FeHRlcm5hbENsYXNzLCAuRXh0ZXJuYWxDbGFzcyBwLCAuRXh0ZXJuYWxDbGFzcyBzcGFuLCAuRXh0ZXJuYWxDbGFzcyBmb250LCAuRXh0ZXJuYWxDbGFzcyB0ZCwgLkV4dGVybmFsQ2xhc3MgZGl2IHtsaW5lLWhlaWdodDogMTAwJTt9DQogICAgICBib2R5IHstd2Via2l0LXRleHQtc2l6ZS1hZGp1c3Q6MTAwJTsgLW1zLXRleHQtc2l6ZS1hZGp1c3Q6MTAwJTttYXJnaW46MCAhaW1wb3J0YW50O30NCiAgICAgIHAgeyBtYXJnaW46IDFlbSAwO30NCiAgICAgIHRhYmxlIHRkIHsgYm9yZGVyLWNvbGxhcHNlOiBjb2xsYXBzZTt9DQogICAgICBpbWcge291dGxpbmU6MDt9DQogICAgICBhIGltZyB7Ym9yZGVyOm5vbmU7fQ0KICAgICAgQC1tcy12aWV3cG9ydHsgd2lkdGg6IGRldmljZS13aWR0aDt9DQogICAgPC9zdHlsZT4NCiAgICA8c3R5bGUgdHlwZT0idGV4dC9jc3MiPg0KICAgICAgQG1lZGlhIG9ubHkgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA0ODBweCkgew0KICAgICAgICAuY29udGFpbmVyIHt3aWR0aDogMTAwJSAhaW1wb3J0YW50O30NCiAgICAgICAgLmZvb3RlciB7IHdpZHRoOmF1dG8gIWltcG9ydGFudDsgbWFyZ2luLWxlZnQ6MDsgfQ0KICAgICAgICAubW9iaWxlLWhpZGRlbiB7IGRpc3BsYXk6bm9uZSAhaW1wb3J0YW50OyB9DQogICAgICAgIC5sb2dvIHsgZGlzcGxheTpibG9jayAhaW1wb3J0YW50OyBwYWRkaW5nOjAgIWltcG9ydGFudDsgfQ0KICAgICAgICBpbWcgeyBtYXgtd2lkdGg6MTAwJSAhaW1wb3J0YW50OyBoZWlnaHQ6YXV0byAhaW1wb3J0YW50OyBtYXgtaGVpZ2h0OmF1dG8gIWltcG9ydGFudDt9DQogICAgICAgIC5oZWFkZXIgaW1ne21heC13aWR0aDoxMDAlICFpbXBvcnRhbnQ7aGVpZ2h0OmF1dG8gIWltcG9ydGFudDsgbWF4LWhlaWdodDphdXRvICFpbXBvcnRhbnQ7fQ0KICAgICAgICAucGhvdG8gaW1nIHsgd2lkdGg6MTAwJSAhaW1wb3J0YW50OyBtYXgtd2lkdGg6MTAwJSAhaW1wb3J0YW50OyBoZWlnaHQ6YXV0byAhaW1wb3J0YW50O30NCiAgICAgICAgLmRyb3AgeyBkaXNwbGF5OmJsb2NrICFpbXBvcnRhbnQ7IHdpZHRoOiAxMDAlICFpbXBvcnRhbnQ7IGZsb2F0OmxlZnQ7IGNsZWFyOmJvdGg7fQ0KICAgICAgICAuZm9vdGVybG9nbyB7IGRpc3BsYXk6YmxvY2sgIWltcG9ydGFudDsgd2lkdGg6IDEwMCUgIWltcG9ydGFudDsgcGFkZGluZy10b3A6MTVweDsgZmxvYXQ6bGVmdDsgY2xlYXI6Ym90aDt9DQogICAgICAgIC5uYXY0LCAubmF2NSwgLm5hdjYgeyBkaXNwbGF5OiBub25lICFpbXBvcnRhbnQ7IH0NCiAgICAgICAgLnRhYmxlQmxvY2sge3dpZHRoOjEwMCUgIWltcG9ydGFudDt9DQogICAgICAgIC5yZXNwb25zaXZlLXRkIHt3aWR0aDoxMDAlICFpbXBvcnRhbnQ7IGRpc3BsYXk6YmxvY2sgIWltcG9ydGFudDsgcGFkZGluZzowICFpbXBvcnRhbnQ7IH0NCiAgICAgICAgLmZsdWlkLCAuZmx1aWQtY2VudGVyZWQgew0KICAgICAgICAgIHdpZHRoOiAxMDAlICFpbXBvcnRhbnQ7DQogICAgICAgICAgbWF4LXdpZHRoOiAxMDAlICFpbXBvcnRhbnQ7DQogICAgICAgICAgaGVpZ2h0OiBhdXRvICFpbXBvcnRhbnQ7DQogICAgICAgICAgbWFyZ2luLWxlZnQ6IGF1dG8gIWltcG9ydGFudDsNCiAgICAgICAgICBtYXJnaW4tcmlnaHQ6IGF1dG8gIWltcG9ydGFudDsNCiAgICAgICAgfQ0KICAgICAgICAuZmx1aWQtY2VudGVyZWQgew0KICAgICAgICAgIG1hcmdpbi1sZWZ0OiBhdXRvICFpbXBvcnRhbnQ7DQogICAgICAgICAgbWFyZ2luLXJpZ2h0OiBhdXRvICFpbXBvcnRhbnQ7DQogICAgICAgIH0NCiAgICAgICAgLyogTU9CSUxFIEdMT0JBTCBTVFlMRVMgLSBETyBOT1QgQ0hBTkdFICovDQogICAgICAgIGJvZHkgeyBwYWRkaW5nOiAwcHggIWltcG9ydGFudDsgZm9udC1zaXplOiAxNnB4ICFpbXBvcnRhbnQ7IGxpbmUtaGVpZ2h0OiAxNTAlICFpbXBvcnRhbnQ7fQ0KICAgICAgICBoMSB7IGZvbnQtc2l6ZTogMjJweCAhaW1wb3J0YW50OyBsaW5lLWhlaWdodDogbm9ybWFsICFpbXBvcnRhbnQ7fQ0KICAgICAgICBoMiB7IGZvbnQtc2l6ZTogMjBweCAhaW1wb3J0YW50OyBsaW5lLWhlaWdodDogbm9ybWFsICFpbXBvcnRhbnQ7fQ0KICAgICAgICBoMyB7IGZvbnQtc2l6ZTogMThweCAhaW1wb3J0YW50OyBsaW5lLWhlaWdodDogbm9ybWFsICFpbXBvcnRhbnQ7fQ0KICAgICAgICAuYnV0dG9uc3R5bGVzIHsNCiAgICAgICAgICBmb250LWZhbWlseTphcmlhbCxoZWx2ZXRpY2Esc2Fucy1zZXJpZiAhaW1wb3J0YW50Ow0KICAgICAgICAgIGZvbnQtc2l6ZTogMTZweCAhaW1wb3J0YW50Ow0KICAgICAgICAgIGNvbG9yOiAjRkZGRkZGICFpbXBvcnRhbnQ7DQogICAgICAgICAgcGFkZGluZzogMTBweCAhaW1wb3J0YW50Ow0KICAgICAgICB9DQogICAgICAgIC8qIEVORCBPRiBNT0JJTEUgR0xPQkFMIFNUWUxFUyAtIERPIE5PVCBDSEFOR0UgKi8NCiAgICAgIH0NCiAgICAgIEBtZWRpYSBvbmx5IHNjcmVlbiBhbmQgKG1heC13aWR0aDogNjQwcHgpIHsNCiAgICAgICAgLmNvbnRhaW5lciB7IHdpZHRoOjEwMCUgIWltcG9ydGFudDsgfQ0KICAgICAgICAubW9iaWxlLWhpZGRlbiB7IGRpc3BsYXk6bm9uZSAhaW1wb3J0YW50OyB9DQogICAgICAgIC5sb2dvIHsgZGlzcGxheTpibG9jayAhaW1wb3J0YW50OyBwYWRkaW5nOjAgIWltcG9ydGFudDsgfQ0KICAgICAgICAucGhvdG8gaW1nIHsgd2lkdGg6MTAwJSAhaW1wb3J0YW50OyBoZWlnaHQ6YXV0byAhaW1wb3J0YW50O30NCiAgICAgICAgLm5hdjUsIC5uYXY2IHsgZGlzcGxheTogbm9uZSAhaW1wb3J0YW50O30NCiAgICAgICAgLmZsdWlkLCAuZmx1aWQtY2VudGVyZWQgew0KICAgICAgICAgIHdpZHRoOiAxMDAlICFpbXBvcnRhbnQ7DQogICAgICAgICAgbWF4LXdpZHRoOiAxMDAlICFpbXBvcnRhbnQ7DQogICAgICAgICAgaGVpZ2h0OiBhdXRvICFpbXBvcnRhbnQ7DQogICAgICAgICAgbWFyZ2luLWxlZnQ6IGF1dG8gIWltcG9ydGFudDsNCiAgICAgICAgICBtYXJnaW4tcmlnaHQ6IGF1dG8gIWltcG9ydGFudDsNCiAgICAgICAgfQ0KICAgICAgICAuZmx1aWQtY2VudGVyZWQgew0KICAgICAgICAgIG1hcmdpbi1sZWZ0OiBhdXRvICFpbXBvcnRhbnQ7DQogICAgICAgICAgbWFyZ2luLXJpZ2h0OiBhdXRvICFpbXBvcnRhbnQ7DQogICAgICAgIH0NCiAgICAgIH0NCiAgICA8L3N0eWxlPg0KICAgIDwhLS1baWYgbXNvXT4gICAgICAgPHN0eWxlIHR5cGU9InRleHQvY3NzIj4gICAgICAgICAgIC8qIEJlZ2luIE91dGxvb2sgRm9udCBGaXggKi8gICAgICAgICAgIGJvZHksIHRhYmxlLCB0ZCB7ICAgICAgICAgICAgICAgZm9udC1mYW1pbHk6IEFyaWFsLCBIZWx2ZXRpY2EsIHNhbnMtc2VyaWYgOyAgICAgICAgICAgICAgIGZvbnQtc2l6ZToxNnB4OyAgICAgICAgICAgICAgIGNvbG9yOiM4MDgwODA7ICAgICAgICAgICAgICAgbGluZS1oZWlnaHQ6MTsgICAgICAgICAgIH0gICAgICAgICAgIC8qIEVuZCBPdXRsb29rIEZvbnQgRml4ICovICAgICAgIDwvc3R5bGU-ICAgICA8IVtlbmRpZl0tLT4NCiAgPC9oZWFkPg0KICA8Ym9keSBiZ2NvbG9yPSIjZWZlZmVmIiB0ZXh0PSIjODA4MDgwIiBzdHlsZT0iYmFja2dyb3VuZC1jb2xvcjogI2VmZWZlZjsgY29sb3I6ICM4MDgwODA7IG1hcmdpbjogMHB4OyBwYWRkaW5nOiAyMHB4OyAtd2Via2l0LXRleHQtc2l6ZS1hZGp1c3Q6bm9uZTsgbGluZS1oZWlnaHQ6IG5vcm1hbDsgZm9udC1zaXplOiAxNnB4OyBmb250LWZhbWlseTphcmlhbCxoZWx2ZXRpY2Esc2Fucy1zZXJpZjsiPjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI-DQpkaXYucHJlaGVhZGVyIA0KeyBkaXNwbGF5OiBub25lICFpbXBvcnRhbnQ7IH0gDQo8L3N0eWxlPg0KPGRpdiBjbGFzcz0icHJlaGVhZGVyIiBzdHlsZT0iZm9udC1zaXplOiAxcHg7IGRpc3BsYXk6IG5vbmUgIWltcG9ydGFudDsiPkFydGljbGVzIGZyb20gdGhlIEV4cGVydHMgKyBGcmVlIG1lbWJlcnNoaXBzPC9kaXY-DQogICAgPGRpdiBzdHlsZT0iZm9udC1zaXplOjA7IGxpbmUtaGVpZ2h0OjA7Ij48aW1nIHNyYz0iaHR0cHM6Ly9jbGljay5jb21tdW5pY2F0aW9ucy50YXdraWZ5LmNvbS9vcGVuLmFzcHg_ZmZjYjEwLWZlYzExNTc4NzM2MTAwN2ItZmU1ZDFjNzE3ZDZkMDM3Yzc1MTQtZmUzOTE1NzA3NTY0MDY3YjcyMTI3MC1mZjY3MTU3NTc3LWZlNWExMTcyNzM2ZDBjN2M3NzEwLWZmMDUxNTc1NzU2NDAwIiB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBhbHQ9IiI-PC9kaXY-DQogICAgPHRhYmxlIHdpZHRoPSIxMDAlIiBib3JkZXI9IjAiIGNlbGxwYWRkaW5nPSIwIiBjZWxsc3BhY2luZz0iMCIgYWxpZ249ImNlbnRlciI-DQogICAgICA8dHI-DQogICAgICAgIDx0ZCBhbGlnbj0iY2VudGVyIiB2YWxpZ249InRvcCI-DQogICAgICAgICAgIA0KICAgICAgICA8L3RkPg0KICAgICAgPC90cj4NCiAgICAgIDx0cj4NCiAgICAgICAgPHRkIGFsaWduPSJjZW50ZXIiPg0KICAgICAgICAgIDx0YWJsZSBjZWxsc3BhY2luZz0iMCIgY2VsbHBhZGRpbmc9IjAiIGJvcmRlcj0iMCIgd2lkdGg9IjYwMCIgY2xhc3M9ImNvbnRhaW5lciIgYWxpZ249ImNlbnRlciI-DQogICAgICAgICAgICA8dHI-DQogICAgICAgICAgICAgIDx0ZD4NCiAgICAgICAgICAgICAgICA8IS0tIGFkZGVkIHRoZSBib3JkZXIgc3R5bGUgaGVyZSAtLT4NCiAgICAgICAgICAgICAgICA8dGFibGUgY2xhc3M9InRiX3Byb3BlcnRpZXMgYm9yZGVyX3N0eWxlIiBjZWxsc3BhY2luZz0iMCIgY2VsbHBhZGRpbmc9IjAiIGJnY29sb3I9IiNmZmZmZmYiIHdpZHRoPSIxMDAlIj4NCiAgICAgICAgICAgICAgICAgIDwhLS0gZW5kIG9mIGNvbW1lbnQgLS0-DQogICAgICAgICAgICAgICAgICA8dHI-DQogICAgICAgICAgICAgICAgICAgIDx0ZCBhbGlnbj0iY2VudGVyIiB2YWxpZ249InRvcCI-DQogICAgICAgICAgICAgICAgICAgICAgPHRhYmxlIGFsaWduPSJsZWZ0IiBib3JkZXI9IjAiIGNlbGxwYWRkaW5nPSIwIiBjZWxsc3BhY2luZz0iMCIgd2lkdGg9IjEwMCUiPg0KICAgICAgICAgICAgICAgICAgICAgICAgPHRyPg0KICAgICAgICAgICAgICAgICAgICAgICAgICA8IS0tIGFkZGVkIHBhZGRpbmcgaGVyZSAtLT4NCiAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzPSJjb250ZW50X3BhZGRpbmciIHN0eWxlPSJwYWRkaW5nOjEwcHg7Ym9yZGVyOjBweDsiPg0KICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwhLS0gZW5kIG9mIGNvbW1lbnQgLS0-DQogICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRhYmxlIGJvcmRlcj0iMCIgY2VsbHBhZGRpbmc9IjAiIGNlbGxzcGFjaW5nPSIwIiB3aWR0aD0iMTAwJSI-DQogICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI-DQogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBhbGlnbj0ibGVmdCIgY2xhc3M9ImhlYWRlciIgdmFsaWduPSJ0b3AiPg0KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0YWJsZSBjZWxscGFkZGluZz0iMCIgY2VsbHNwYWNpbmc9IjAiIHdpZHRoPSIxMDAlIiByb2xlPSJwcmVzZW50YXRpb24iIHN0eWxlPSJiYWNrZ3JvdW5kLWNvbG9yOiB0cmFuc3BhcmVudDsgbWluLXdpZHRoOiAxMDAlOyBib3JkZXItdG9wOiAwcHg7IGJvcmRlci1yaWdodDogMHB4OyBib3JkZXItYm90dG9tOiAxcHggc29saWQgdHJhbnNwYXJlbnQ7IGJvcmRlci1sZWZ0OiAwcHg7ICIgY2xhc3M9InNsb3Qtc3R5bGluZyI-PHRyPjx0ZCBzdHlsZT0icGFkZGluZzogMHB4IDBweCAyMHB4OyAiIGNsYXNzPSJzbG90LXN0eWxpbmcgY2FtYXJrZXItaW5uZXIiPjx0YWJsZSBjZWxscGFkZGluZz0iMCIgY2VsbHNwYWNpbmc9IjAiIHdpZHRoPSIxMDAlIiByb2xlPSJwcmVzZW50YXRpb24iIHN0eWxlPSJtaW4td2lkdGg6IDEwMCU7ICIgY2xhc3M9InN0eWxpbmdibG9jay1jb250ZW50LXdyYXBwZXIiPjx0cj48dGQgY2xhc3M9InN0eWxpbmdibG9jay1jb250ZW50LXdyYXBwZXIgY2FtYXJrZXItaW5uZXIiPjx0YWJsZSB3aWR0aD0iMTAwJSIgY2VsbHNwYWNpbmc9IjAiIGNlbGxwYWRkaW5nPSIwIiByb2xlPSJwcmVzZW50YXRpb24iPjx0cj48dGQgYWxpZ249ImNlbnRlciI-PGEgaHJlZj0iaHR0cHM6Ly9jbGljay5jb21tdW5pY2F0aW9ucy50YXdraWZ5LmNvbS8_cXM9Yjk0YmQ0YWI5OGYxMDEzZDFkNDg5NmQyNDNmZDc0NTBhZTM5ZTc4MzVlMDJjNjFhYzVjN2M3ODg4YzA2ZmRmNzQ5ZGI3YzJiY2Q4YmE3ZjliYjk1ODY2ZDE1MDY0ZDVmYWFiYWU3Mjc1ZmYzYmYwNGM0OTdhMDQ3YzA1ZjY4NjIiIHRpdGxlPSJCZWNvbWUgYSBwb3NzaWJsZSBtYXRjaCBmb3IgVGF3a2lmeSBjbGllbnRzIiAgIGRhdGEtbGlua3RvPSJodHRwczovLyI-DQo8aW1nIGRhdGEtYXNzZXRpZD0iNTk2NDAiIHNyYz0iaHR0cHM6Ly9pbWFnZS5jb21tdW5pY2F0aW9ucy50YXdraWZ5LmNvbS9saWIvZmUzOTE1NzA3NTY0MDY3YjcyMTI3MC9tLzEvZWNiNDUwOWEtYTllZS00YjIxLTlmYmQtNjE0NDk2ZTMzNWY0LnBuZyIgYWx0PSIiIHdpZHRoPSIxMjAwIiBzdHlsZT0iZGlzcGxheTogYmxvY2s7IHBhZGRpbmc6IDBweDsgdGV4dC1hbGlnbjogY2VudGVyOyBoZWlnaHQ6IGF1dG87IHdpZHRoOiAxMDAlOyBib3JkZXI6IDBweDsiPjwvYT48L3RkPjwvdHI-PC90YWJsZT48L3RkPjwvdHI-PC90YWJsZT48L3RkPjwvdHI-PC90YWJsZT4NCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICANCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD4NCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI-DQogICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI-DQogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBhbGlnbj0ibGVmdCIgY2xhc3M9IiIgdmFsaWduPSJ0b3AiPg0KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0YWJsZSBjZWxscGFkZGluZz0iMCIgY2VsbHNwYWNpbmc9IjAiIHdpZHRoPSIxMDAlIiByb2xlPSJwcmVzZW50YXRpb24iIHN0eWxlPSJiYWNrZ3JvdW5kLWNvbG9yOiB0cmFuc3BhcmVudDsgbWluLXdpZHRoOiAxMDAlOyBib3JkZXItdG9wOiAwcHg7IGJvcmRlci1yaWdodDogMHB4OyBib3JkZXItYm90dG9tOiAxcHggc29saWQgdHJhbnNwYXJlbnQ7IGJvcmRlci1sZWZ0OiAwcHg7ICIgY2xhc3M9InNsb3Qtc3R5bGluZyI-PHRyPjx0ZCBzdHlsZT0icGFkZGluZzogMHB4IDBweCAyMHB4OyAiIGNsYXNzPSJzbG90LXN0eWxpbmcgY2FtYXJrZXItaW5uZXIiPjx0YWJsZSBjZWxscGFkZGluZz0iMCIgY2VsbHNwYWNpbmc9IjAiIHdpZHRoPSIxMDAlIiByb2xlPSJwcmVzZW50YXRpb24iIHN0eWxlPSJiYWNrZ3JvdW5kLWNvbG9yOiB0cmFuc3BhcmVudDsgbWluLXdpZHRoOiAxMDAlOyAiIGNsYXNzPSJzdHlsaW5nYmxvY2stY29udGVudC13cmFwcGVyIj48dHI-PHRkIHN0eWxlPSJwYWRkaW5nOiA4cHggMTBweCAwcHg7ICIgY2xhc3M9InN0eWxpbmdibG9jay1jb250ZW50LXdyYXBwZXIgY2FtYXJrZXItaW5uZXIiPjx0YWJsZSBjZWxsc3BhY2luZz0iMCIgY2VsbHBhZGRpbmc9IjAiIHN0eWxlPSJ3aWR0aDogMTAwJTsiPjx0cj48dGQ-PHRhYmxlIGNlbGxzcGFjaW5nPSIwIiBjZWxscGFkZGluZz0iMCIgc3R5bGU9IndpZHRoOiAxMDAlOyI-PHRyPjx0ZCB2YWxpZ249InRvcCIgY2xhc3M9InJlc3BvbnNpdmUtdGQiIHN0eWxlPSJ3aWR0aDogMTAwJTsiPjx0YWJsZSBjZWxscGFkZGluZz0iMCIgY2VsbHNwYWNpbmc9IjAiIHdpZHRoPSIxMDAlIiByb2xlPSJwcmVzZW50YXRpb24iIHN0eWxlPSJiYWNrZ3JvdW5kLWNvbG9yOiB0cmFuc3BhcmVudDsgbWluLXdpZHRoOiAxMDAlOyAiIGNsYXNzPSJzdHlsaW5nYmxvY2stY29udGVudC13cmFwcGVyIj48dHI-DQo8dGQgc3R5bGU9InBhZGRpbmc6IDBweCAwcHggMzBweDsgIiBjbGFzcz0ic3R5bGluZ2Jsb2NrLWNvbnRlbnQtd3JhcHBlciBjYW1hcmtlci1pbm5lciI-PGRpdiBzdHlsZT0idGV4dC1hbGlnbjoganVzdGlmeTsiPg0KCTxzcGFuIHN0eWxlPSJmb250LXNpemU6MTJweDsiPjxzcGFuIHN0eWxlPSJmb250LWZhbWlseTpWZXJkYW5hLEdlbmV2YSxzYW5zLXNlcmlmOyI-PGZvbnQgY29sb3I9IiMzYTNhM2MiPkl0J3MgYmVlbiBhIHdlaXJkIHllYXIsIEt1bmFsLCBhbmQgVmFsZW50aW5lJ3MgRGF5IDIwMjEgaXMgbm8gZXhjZXB0aW9uISZuYnNwO1dlIGtub3cgaG93IG11Y2ggZGF0aW5nIGhhcyBjaGFuZ2VkLCBzbyBvdXIgdGVhbSBoYXMmbmJzcDtiZWVuIHdvcmtpbmcgb24gc29tZSBuZXcgdGhpbmdzIHRvIGhlbHAgZXZlcnlvbmUgZGF0ZS1vbiB3aXRoIGNvbmZpZGVuY2UsIHdoYXRldmVyIGNvbWVzOjwvZm9udD48L3NwYW4-PC9zcGFuPjxicj4NCgkmbmJzcDs8L2Rpdj48ZGl2IHN0eWxlPSJ0ZXh0LWFsaWduOiBjZW50ZXI7Ij4NCglWaXJ0dWFsIGRhdGVycywgdGhpcyBpcyBhIDxhICAgZGF0YS1saW5rdG89Imh0dHA6Ly8iIGhyZWY9Imh0dHBzOi8vY2xpY2suY29tbXVuaWNhdGlvbnMudGF3a2lmeS5jb20vP3FzPWI5NGJkNGFiOThmMTAxM2RlNTBiYTI5YjczYTU0MDk4ZmI1MDU3YzQ2MmEyOTQ2NDhjYjQ4ZjYxYzk3YTgzMzFhNGZiNzhiZTllZGVkMjE3ZjYzY2Q1MWRhMWU1OTE2MGMzZDE3YjNjYWVkNTMwM2VmOWUzYmIwOGY5ZDVkNWE4IiBzdHlsZT0iY29sb3I6I0VFMkM3Qzt0ZXh0LWRlY29yYXRpb246dW5kZXJsaW5lOyIgdGl0bGU9InZpZGVvIGRhdGUgZHJlc3NpbmcgZ3VpZGUiPnZpZGVvIGRhdGUgZHJlc3NpbmcgZ3VpZGU8L2E-IGZyb20gb3VyIGJsb2c8L2Rpdj48ZGl2IHN0eWxlPSJ0ZXh0LWFsaWduOiBjZW50ZXI7Ij4NCgkmbmJzcDsgdGVhbSwgYW5kIGhlcmUgaXMgYSBjYXRjaC1hbGwgYXJ0aWNsZSZuYnNwOzxhICAgZGF0YS1saW5rdG89Imh0dHA6Ly8iIGhyZWY9Imh0dHBzOi8vY2xpY2suY29tbXVuaWNhdGlvbnMudGF3a2lmeS5jb20vP3FzPWI5NGJkNGFiOThmMTAxM2RlMzM1ZjFjYjVkMDg2MDMxNGU0ZjkwZWVjYzI5MjFjZmRmNWE0NzQ0YWVlZTRlNWZhMWVlNDRhMzIzYmE3ZjgzMmNiMDhkNmI5NTVjODY1NTc1M2ZiMDUxMmRiZDNiY2M1OWZjNzk2ZjMxNWViMDMxIiBzdHlsZT0iY29sb3I6I0VFMkM3Qzt0ZXh0LWRlY29yYXRpb246dW5kZXJsaW5lOyIgdGl0bGU9ImhlcmUgaXMgYSBjYXRjaC1hbGwgYXJ0aWNsZSI-Zm9yIGRhdGUgcGxhbm5pbmcgaW4gMjAyMTwvYT4uPC9kaXY-PGRpdiBzdHlsZT0idGV4dC1hbGlnbjoganVzdGlmeTsiPg0KCTxicj4NCgk8c3BhbiBzdHlsZT0iZm9udC1zaXplOjEycHg7Ij48c3BhbiBzdHlsZT0iZm9udC1mYW1pbHk6VmVyZGFuYSxHZW5ldmEsc2Fucy1zZXJpZjsiPjxmb250IGNvbG9yPSIjM2EzYTNjIj5BbHNvIGdvaW5nIG9uIHRoaXMgbW9udGgsIG91ciBhbm51YWwgPGI-TW9udGggb2YgTG92ZSA8L2I-ZXZlbnQuIEFsbCBGZWJydWFyeSBsb25nLCZuYnNwO3dlIG9wZW4gPGk-bWF0Y2hhYmxlIG1lbWJlcnNoaXA8L2k-IHRvIHlvdSBhbmQgdG8gdGhvc2UgeW91IHRoaW5rIHdvdWxkIGJlIGEgZ29vZCBhZGRpdGlvbiB0byB0aGUgbmV0d29yay4gVGhvc2Ugd2hvIGFjY2VwdCB0aGUgaW52aXRhdGlvbiBhcmUgYWN0aXZhdGVkIGZvciBhIHllYXIgb2YgcG9zc2libGUgbWF0Y2hpbmcgd2l0aCBUYXdraWZ5IGNsaWVudHMuJm5ic3A7PGEgICBkYXRhLWxpbmt0bz0iaHR0cHM6Ly8iIGhyZWY9Imh0dHBzOi8vY2xpY2suY29tbXVuaWNhdGlvbnMudGF3a2lmeS5jb20vP3FzPWI5NGJkNGFiOThmMTAxM2Q5ZjA2ZTAyYjc1YjdlMTI1Y2EzNDg4YWViZTIxY2E4M2FkNGNjZTc5ODAxMDRlYzM2NTZhYzI0YzAwM2ZjOTJmZDE5MDg3NmNiOTJiYzZiYTQ2M2ZlNTdmYTkwODAzNmFkMDEzZjI1YjRhMDA0YTQ1IiBzdHlsZT0iY29sb3I6IzI0Yjc4NzsgdGV4dC1kZWNvcmF0aW9uOnVuZGVybGluZSIgdGl0bGU9IkZyZWUgbWVtYmVyc2hpcCB3aWxsIGtpY2stb2ZmIGF0IGNvbmNsdXNpb24gb2YgY3VycmVudCBleHBlcmllbmNlLiI-R2l2ZSB0byB5b3Vyc2VsZjwvYT4mbmJzcDt3aXRoIHRoaXMgbGluaywgdGhlbiANCjxhICAgZGF0YS1saW5rdG89Imh0dHA6Ly8iIGhyZWY9Imh0dHBzOi8vY2xpY2suY29tbXVuaWNhdGlvbnMudGF3a2lmeS5jb20vP3FzPWI5NGJkNGFiOThmMTAxM2RhYmE0MDQyMjViNTBjZjgwMTcyOGIwZjQ5YTgyZTYwZDI4MmIwOTJjYTU3NzVlYjI5Y2E4MTc4OWM3ZWRkYTVmODU4MDMxYTcyMWEwNDU1ZjA5ZWM5MjIzZjkxMDM1NzUyNGIzNDhlNWRhYjEwMTcyIiBzdHlsZT0iY29sb3I6IzI0Qjc4Nzt0ZXh0LWRlY29yYXRpb246dW5kZXJsaW5lOyIgdGl0bGU9IkJlY29tZSBhIHBvc3NpYmxlIG1hdGNoIGZvciBUYXdraWZ5IGNsaWVudHMiPnNoYXJlIHdpdGggdGhpcyBvbmU8L2E-LiZuYnNwOzwvZm9udD48L3NwYW4-PC9zcGFuPjwvZGl2PjwvdGQ-PC90cj48L3RhYmxlPjx0YWJsZSBjZWxscGFkZGluZz0iMCIgY2VsbHNwYWNpbmc9IjAiIHdpZHRoPSIxMDAlIiByb2xlPSJwcmVzZW50YXRpb24iIHN0eWxlPSJiYWNrZ3JvdW5kLWNvbG9yOiB0cmFuc3BhcmVudDsgbWluLXdpZHRoOiAxMDAlOyAiIGNsYXNzPSJzdHlsaW5nYmxvY2stY29udGVudC13cmFwcGVyIj48dHI-PHRkIHN0eWxlPSJwYWRkaW5nOiAwcHggMHB4IDEwcHg7ICIgY2xhc3M9InN0eWxpbmdibG9jay1jb250ZW50LXdyYXBwZXIgY2FtYXJrZXItaW5uZXIiPjx0YWJsZSB3aWR0aD0iMTAwJSIgYm9yZGVyPSIwIiBjZWxsc3BhY2luZz0iMCIgY2VsbHBhZGRpbmc9IjAiIHJvbGU9InByZXNlbnRhdGlvbiI-PHRyPjx0ZCBhbGlnbj0iY2VudGVyIj48dGFibGUgYm9yZGVyPSIwIiBjZWxsc3BhY2luZz0iMCIgY2VsbHBhZGRpbmc9IjAiIHJvbGU9InByZXNlbnRhdGlvbiI-PHRyPg0KPHRkIGNsYXNzPSJpbm5lcnRkIGJ1dHRvbmJsb2NrIiBiZ2NvbG9yPSIjMjMxRjIwIiBzdHlsZT0iIGJvcmRlci1yYWRpdXM6IDBweDsgLW1vei1ib3JkZXItcmFkaXVzOiAwcHg7IC13ZWJraXQtYm9yZGVyLXJhZGl1czogMHB4OyBiYWNrZ3JvdW5kLWNvbG9yOiAjMjMxRjIwOyI-DQo8YSB0YXJnZXQ9Il9ibGFuayIgY2xhc3M9ImJ1dHRvbnN0eWxlcyIgc3R5bGU9IiBmb250LXNpemU6IDEzcHg7IGZvbnQtZmFtaWx5OiBWZXJkYW5hLCBHZW5ldmEsIHNhbnMtc2VyaWY7IGNvbG9yOiAjRkZGRkZGOyB0ZXh0LWFsaWduOiBjZW50ZXI7IHRleHQtZGVjb3JhdGlvbjogbm9uZTsgZGlzcGxheTogYmxvY2s7IGJhY2tncm91bmQtY29sb3I6ICMyMzFGMjA7IGJvcmRlcjogMHB4IHNvbGlkICMyMzFGMjA7IHBhZGRpbmc6IDEwcHggMjVweDsgYm9yZGVyLXJhZGl1czogMHB4OyAtbW96LWJvcmRlci1yYWRpdXM6IDBweDsgLXdlYmtpdC1ib3JkZXItcmFkaXVzOiAwcHg7IiBocmVmPSJodHRwczovL2NsaWNrLmNvbW11bmljYXRpb25zLnRhd2tpZnkuY29tLz9xcz1iOTRiZDRhYjk4ZjEwMTNkMWQ0ODk2ZDI0M2ZkNzQ1MGFlMzllNzgzNWUwMmM2MWFjNWM3Yzc4ODhjMDZmZGY3NDlkYjdjMmJjZDhiYTdmOWJiOTU4NjZkMTUwNjRkNWZhYWJhZTcyNzVmZjNiZjA0YzQ5N2EwNDdjMDVmNjg2MiIgdGl0bGU9IkJlY29tZSBhIHBvc3NpYmxlIG1hdGNoIGZvciBUYXdraWZ5IGNsaWVudHMiICAgZGF0YS1saW5rdG89Imh0dHBzOi8vIj5BQ1RJVkFURSBNWSBGUkVFIE1FTUJFUlNISVA8L2E-PC90ZD48L3RyPjwvdGFibGU-PC90ZD48L3RyPjwvdGFibGU-PC90ZD48L3RyPjwvdGFibGU-PC90ZD48L3RyPjwvdGFibGU-PC90ZD48L3RyPjwvdGFibGU-PC90ZD48L3RyPjwvdGFibGU-PHRhYmxlIGNlbGxwYWRkaW5nPSIwIiBjZWxsc3BhY2luZz0iMCIgd2lkdGg9IjEwMCUiIHJvbGU9InByZXNlbnRhdGlvbiIgc3R5bGU9Im1pbi13aWR0aDogMTAwJTsgIiBjbGFzcz0ic3R5bGluZ2Jsb2NrLWNvbnRlbnQtd3JhcHBlciI-PHRyPjx0ZCBjbGFzcz0ic3R5bGluZ2Jsb2NrLWNvbnRlbnQtd3JhcHBlciBjYW1hcmtlci1pbm5lciI-DQo8dGFibGUgd2lkdGg9IjEwMCUiIGNlbGxzcGFjaW5nPSIwIiBjZWxscGFkZGluZz0iMCIgcm9sZT0icHJlc2VudGF0aW9uIj48dHI-PHRkIGFsaWduPSJjZW50ZXIiPjxhIGhyZWY9Imh0dHBzOi8vY2xpY2suY29tbXVuaWNhdGlvbnMudGF3a2lmeS5jb20vP3FzPWI5NGJkNGFiOThmMTAxM2RmZjgxZDgzY2YyZDg1ODM4YTNkMTA4Y2Q3ZGZmYmM3NGNhN2Q0ZmI4NzU2MGViYjFmODEyMWU0ZTJlNmFmMDc3MzdkZGIyN2UwYzg5OGY2NzYwYTBiOTEyMzUwN2U2YjRmYTI5NmVmZDlmNDI4N2MwIiB0aXRsZT0iSm9pbiB0aGUgY29tbXVuaXR5IHRhd2shIiAgIGRhdGEtbGlua3RvPSJodHRwOi8vIj48aW1nIGRhdGEtYXNzZXRpZD0iNTk2NDIiIHNyYz0iaHR0cHM6Ly9pbWFnZS5jb21tdW5pY2F0aW9ucy50YXdraWZ5LmNvbS9saWIvZmUzOTE1NzA3NTY0MDY3YjcyMTI3MC9tLzEvN2QxZWNlOTctOGU2My00YTVkLWFmOWUtOTJjYjgwMGU0NGJmLnBuZyIgYWx0PSIiIHdpZHRoPSIxMjAwIiBzdHlsZT0iZGlzcGxheTogYmxvY2s7IHBhZGRpbmc6IDBweDsgdGV4dC1hbGlnbjogY2VudGVyOyBoZWlnaHQ6IGF1dG87IHdpZHRoOiAxMDAlOyBib3JkZXI6IDBweDsiPjwvYT48L3RkPjwvdHI-PC90YWJsZT48L3RkPjwvdHI-PC90YWJsZT48L3RkPjwvdHI-PC90YWJsZT4NCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICANCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD4NCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI-DQogICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI-DQogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBhbGlnbj0ibGVmdCIgY2xhc3M9IiIgdmFsaWduPSJ0b3AiPg0KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0YWJsZSBjZWxscGFkZGluZz0iMCIgY2VsbHNwYWNpbmc9IjAiIHdpZHRoPSIxMDAlIiByb2xlPSJwcmVzZW50YXRpb24iIHN0eWxlPSJiYWNrZ3JvdW5kLWNvbG9yOiB0cmFuc3BhcmVudDsgYm9yZGVyOiAxcHggc29saWQgI0U0RTRFNDsgbWluLXdpZHRoOiAxMDAlOyAiIGNsYXNzPSJzbG90LXN0eWxpbmciPjx0cj48dGQgc3R5bGU9InBhZGRpbmc6IDBweDsgIiBjbGFzcz0ic2xvdC1zdHlsaW5nIGNhbWFya2VyLWlubmVyIj48dGFibGUgY2VsbHBhZGRpbmc9IjAiIGNlbGxzcGFjaW5nPSIwIiB3aWR0aD0iMTAwJSIgcm9sZT0icHJlc2VudGF0aW9uIiBjbGFzcz0ic3R5bGluZ2Jsb2NrLWNvbnRlbnQtd3JhcHBlciIgc3R5bGU9Im1pbi13aWR0aDogMTAwJTsgIj48dHI-PHRkIGNsYXNzPSJzdHlsaW5nYmxvY2stY29udGVudC1tYXJnaW4tY2VsbCIgYWxpZ249ImxlZnQiIHN0eWxlPSJwYWRkaW5nOiAwcHggMHB4IDEwcHg7ICI-PHRhYmxlIGNlbGxwYWRkaW5nPSIwIiBjZWxsc3BhY2luZz0iMCIgd2lkdGg9IjEwMCUiIHJvbGU9InByZXNlbnRhdGlvbiIgc3R5bGU9InRleHQtYWxpZ246IGxlZnQ7IGJhY2tncm91bmQtY29sb3I6IHRyYW5zcGFyZW50OyBtaW4td2lkdGg6IDEwMCU7ICIgY2xhc3M9InN0eWxpbmdibG9jay1jb250ZW50LXdyYXBwZXIiPjx0cj48dGQgc3R5bGU9InBhZGRpbmc6IDBweDsgIiBjbGFzcz0ic3R5bGluZ2Jsb2NrLWNvbnRlbnQtd3JhcHBlciBjYW1hcmtlci1pbm5lciIgYWxpZ249ImxlZnQiPjx0YWJsZSBjZWxscGFkZGluZz0iMCIgY2VsbHNwYWNpbmc9IjAiIGNsYXNzPSJzb2NpYWxzaGFyZS13cmFwcGVyIiB3aWR0aD0iMTAwJSI-PHRyPjx0ZCBhbGlnbj0iY2VudGVyIj48dGFibGUgY2VsbHBhZGRpbmc9IjAiIGNlbGxzcGFjaW5nPSIwIiBhbGlnbj0iY2VudGVyIj48dHI-PHRkIGFsaWduPSJjZW50ZXIiPg0KPCEtLVtpZiBtc29dPjx0YWJsZSBib3JkZXI9IjAiIGNlbGxzcGFjaW5nPSIwIiBjZWxscGFkZGluZz0iMCI-PHRyPjx0ZCBzdHlsZT0icGFkZGluZy1yaWdodDoxMHB4OyI-DQo8IVtlbmRpZl0tLT48dGFibGUgY2xhc3M9InNvY2lhbHNoYXJlLWlubmVydGFibGUiIHN0eWxlPSJkaXNwbGF5OiBpbmxpbmUtYmxvY2siPjx0cj48dGQgc3R5bGU9InBhZGRpbmc6NXB4IDEwcHgiPjxhIGhyZWY9Imh0dHBzOi8vY2xpY2suY29tbXVuaWNhdGlvbnMudGF3a2lmeS5jb20vP3FzPWI5NGJkNGFiOThmMTAxM2Q5MWQ5YzgxNzI5N2EwYWZhYzU3YTJjYWUyOTU4NTMxY2FlOTlkNGUzYjUzMDE2YzQwYzQwYmUyNWFiMWEyZDBiMTFjZmNmZWNmNGYxNjc0YzViNDU4YmE1MTNhYjc3ZjQwZGM0NjU5NmNhZDQyMzU4IiA-PGltZyBzcmM9Imh0dHBzOi8vaW1hZ2UuczQuZXhjdC5uZXQvbGliL2ZlOTExNTczNzM2YzAwN2Q3ZC9tLzIvMjRiODRlMjItOGQzOC00ZDZjLTk4ZGItODA4MTJjYTRkZTVmLnBuZyIgYWx0PSJGYWNlYm9vayIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBzdHlsZT0iZGlzcGxheTogYmxvY2s7OyB3aWR0aDogMjRweCAhaW1wb3J0YW50OyBoZWlnaHQ6IDI0cHggIWltcG9ydGFudCI-PC9hPjwvdGQ-PC90cj48L3RhYmxlPjwhLS1baWYgbXNvXT48L3RkPjx0ZCBzdHlsZT0icGFkZGluZy1yaWdodDoxMHB4OyI-PCFbZW5kaWZdLS0-PHRhYmxlIGNsYXNzPSJzb2NpYWxzaGFyZS1pbm5lcnRhYmxlIiBzdHlsZT0iZGlzcGxheTogaW5saW5lLWJsb2NrIj48dHI-PHRkIHN0eWxlPSJwYWRkaW5nOjVweCAxMHB4Ij48YSBocmVmPSJodHRwczovL2NsaWNrLmNvbW11bmljYXRpb25zLnRhd2tpZnkuY29tLz9xcz1iOTRiZDRhYjk4ZjEwMTNkNTk4MWQ5NDkyN2ZiNWE4NWEyYTYwZTEzZTAxOTk4YmZmOGE5MTg5MDQzOWY4NTEzOTc5Yjc5NGRkOGQxMWVkYjYwYmIwYzQwMDdhNTViNzZlMGQwNzQyMTI2OGU4ZjRhNWFlMmNlZjgwMGVhMmQwYyIgPg0KPGltZyBzcmM9Imh0dHBzOi8vaW1hZ2UuczQuZXhjdC5uZXQvbGliL2ZlOTExNTczNzM2YzAwN2Q3ZC9tLzIvYTE0YzI0MzktNzAyNS00YWFiLWEwMWYtNDIzMDc3MTkzNjg3LnBuZyIgYWx0PSJUd2l0dGVyIiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHN0eWxlPSJkaXNwbGF5OiBibG9jazs7IHdpZHRoOiAyNHB4ICFpbXBvcnRhbnQ7IGhlaWdodDogMjRweCAhaW1wb3J0YW50Ij48L2E-PC90ZD48L3RyPjwvdGFibGU-PCEtLVtpZiBtc29dPjwvdGQ-PHRkIHN0eWxlPSJwYWRkaW5nLXJpZ2h0OjEwcHg7Ij48IVtlbmRpZl0tLT48dGFibGUgY2xhc3M9InNvY2lhbHNoYXJlLWlubmVydGFibGUiIHN0eWxlPSJkaXNwbGF5OiBpbmxpbmUtYmxvY2siPjx0cj48dGQgc3R5bGU9InBhZGRpbmc6NXB4IDEwcHgiPjxhIGhyZWY9Imh0dHBzOi8vY2xpY2suY29tbXVuaWNhdGlvbnMudGF3a2lmeS5jb20vP3FzPTQwOTk2NjI2OTI3NDc2OTNjNTFjMjBiN2I1NDgyNmViZjA4ZThhNThmYTJhYzVhNDM0MTU1ODcwZWE0MDA2YTBkODNkMzZlNTk5ZWEyYTQwMjYwZmIyMzM0N2M4NTY4ZTE3YjBhNWUwNjY4MGI0NGZhYjU5YTIzZTJjNzM0OTlhIiA-PGltZyBzcmM9Imh0dHBzOi8vaW1hZ2UuczQuZXhjdC5uZXQvbGliL2ZlOTExNTczNzM2YzAwN2Q3ZC9tLzIvMTFhNGExYWEtNGU4YS00MzJhLThmMWYtZjg4OTgyMDZkYTM5LnBuZyIgYWx0PSJJbnN0YWdyYW0iIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgc3R5bGU9ImRpc3BsYXk6IGJsb2NrOzsgd2lkdGg6IDI0cHggIWltcG9ydGFudDsgaGVpZ2h0OiAyNHB4ICFpbXBvcnRhbnQiPjwvYT48L3RkPjwvdHI-PC90YWJsZT48IS0tW2lmIG1zb10-PC90ZD48dGQ-PCFbZW5kaWZdLS0-DQo8dGFibGUgY2xhc3M9InNvY2lhbHNoYXJlLWlubmVydGFibGUiIHN0eWxlPSJkaXNwbGF5OiBpbmxpbmUtYmxvY2siPjx0cj48dGQgc3R5bGU9InBhZGRpbmc6NXB4IDEwcHgiPjxhIGhyZWY9Imh0dHBzOi8vY2xpY2suY29tbXVuaWNhdGlvbnMudGF3a2lmeS5jb20vP3FzPTQwOTk2NjI2OTI3NDc2OTMzNjlkNTYzNThlNzJmN2QwYjIxODNkMzg4Yjk1OGMxODg0NTlhOGQxNjMzMTJhMGUxYzAyMDYzNTk2YjlkNjczNGRkZDgxMDUwZDY4Yzc5ZWY0ZDI5MzE1ZjFjZmYwNjlmMzJjMWE5NTFlOGZkMmZlIiA-PGltZyBzcmM9Imh0dHBzOi8vaW1hZ2UuczQuZXhjdC5uZXQvbGliL2ZlOTExNTczNzM2YzAwN2Q3ZC9tLzIvNDRjYWU5YTMtZWJhOS00OGI5LTkxMWItNzA1Zjc3NzdjZDBlLnBuZyIgYWx0PSJMaW5rZWRJbiIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBzdHlsZT0iZGlzcGxheTogYmxvY2s7OyB3aWR0aDogMjRweCAhaW1wb3J0YW50OyBoZWlnaHQ6IDI0cHggIWltcG9ydGFudCI-PC9hPjwvdGQ-PC90cj48L3RhYmxlPjwhLS1baWYgbXNvXT48L3RkPjwvdHI-PC90YWJsZT48IVtlbmRpZl0tLT48L3RkPjwvdHI-PC90YWJsZT48L3RkPjwvdHI-PC90YWJsZT48L3RkPjwvdHI-PC90YWJsZT48L3RkPjwvdHI-PC90YWJsZT48dGFibGUgY2VsbHBhZGRpbmc9IjAiIGNlbGxzcGFjaW5nPSIwIiB3aWR0aD0iMTAwJSIgcm9sZT0icHJlc2VudGF0aW9uIiBzdHlsZT0iYmFja2dyb3VuZC1jb2xvcjogdHJhbnNwYXJlbnQ7IG1pbi13aWR0aDogMTAwJTsgIiBjbGFzcz0ic3R5bGluZ2Jsb2NrLWNvbnRlbnQtd3JhcHBlciI-PHRyPjx0ZCBzdHlsZT0icGFkZGluZzogMHB4OyAiIGNsYXNzPSJzdHlsaW5nYmxvY2stY29udGVudC13cmFwcGVyIGNhbWFya2VyLWlubmVyIj4NCjx0YWJsZSBiZ2NvbG9yPSIjRkZGRkZGIiBib3JkZXI9IjAiIGNlbGxwYWRkaW5nPSIwIiBjZWxsc3BhY2luZz0iMCIgc3R5bGU9ImNvbG9yOiByZ2IoMCwgMCwgMCk7IGZvbnQtZmFtaWx5OiBUaW1lczsgZm9udC1zaXplOiBtZWRpdW07IGxpbmUtaGVpZ2h0OiBub3JtYWw7IGJvcmRlci1jb2xsYXBzZTogY29sbGFwc2U7IGJhY2tncm91bmQtaW1hZ2U6IGluaXRpYWw7IGJhY2tncm91bmQtYXR0YWNobWVudDogaW5pdGlhbDsgYmFja2dyb3VuZC1zaXplOiBpbml0aWFsOyBiYWNrZ3JvdW5kLW9yaWdpbjogaW5pdGlhbDsgYmFja2dyb3VuZC1jbGlwOiBpbml0aWFsOyBiYWNrZ3JvdW5kLXBvc2l0aW9uOiBpbml0aWFsOyBiYWNrZ3JvdW5kLXJlcGVhdDogaW5pdGlhbDsiIHdpZHRoPSIxMDAlIj4NCgkNCgkJPHRyPg0KCQkJPHRkIGFsaWduPSJsZWZ0IiBzdHlsZT0iZm9udC1mYW1pbHk6IEhlbHZldGljYSwgJnF1b3Q7SGVsdmV0aWNhIE5ldWUmcXVvdDssIEFyaWFsLCBHb3RoYW0sIHNhbnMtc2VyaWY7IGZvbnQtc2l6ZTogMTRweDsgbGluZS1oZWlnaHQ6IDIycHg7IG1hcmdpbjogMHB4OyBwYWRkaW5nOiAyMHB4IDI1cHggMTBweDsiIHZhbGlnbj0idG9wIj4NCgkJCQk8ZGl2IGNsYXNzPSJta3RFZGl0YWJsZSIgaWQ9ImNvbnRlbnQiIHN0eWxlPSIiPg0KCQkJCQk8ZGl2IHN0eWxlPSJ0ZXh0LWFsaWduOiBjZW50ZXI7Ij4NCgkJCQkJCTxzcGFuIHN0eWxlPSJmb250LXNpemU6MTFweDsiPjxzcGFuIHN0eWxlPSJmb250LWZhbWlseTogSGVsdmV0aWNhLCAmcXVvdDtIZWx2ZXRpY2EgTmV1ZSZxdW90OywgQXJpYWwsIEdvdGhhbSwgc2Fucy1zZXJpZjsiPjxzcGFuIHN0eWxlPSJjb2xvcjogcmdiKDAsIDAsIDApOyBmb250LXdlaWdodDogbGlnaHRlcjsiPlZhbHVlICQ5OTxiPiZuYnNwOzwvYj4mbWRhc2g7IDx1PjxhICAgZGF0YS1saW5rdG89Imh0dHBzOi8vIiBocmVmPSJodHRwczovL2NsaWNrLmNvbW11bmljYXRpb25zLnRhd2tpZnkuY29tLz9xcz00MDk5NjYyNjkyNzQ3NjkzZTk5NzBhYjE5NTZiNWZmMmRlNjIwN2Q2ZWNhNDJjZGEzNzczYTk3ZjZiZjk2MDMwNmI1MmIwODk0NTg3OWVkMTcyM2QxMGMzZjM2NTViYTFlMmQyODg5YmI5N2MwMGJhM2VmMzFjZjgxYWEyZWMzNyIgc3R5bGU9ImNvbG9yOiMyNzI3Mjc7dGV4dC1kZWNvcmF0aW9uOm5vbmU7IiB0aXRsZT0iQmVjb21lIGEgcG9zc2libGUgbWF0Y2ggZm9yIFRhd2tpZnkgY2xpZW50cyI-RnJlZSB3aXRoIHRoaXMgb2ZmZXI8L2E-PC91Pi48L3NwYW4-PC9zcGFuPjwvc3Bhbj48L2Rpdj48YmxvY2txdW90ZT4NCgkJCQkJCTxwIHN0eWxlPSJmb250LWZhbWlseTogSGVsdmV0aWNhLCAmcXVvdDtIZWx2ZXRpY2EgTmV1ZSZxdW90OywgQXJpYWwsIEdvdGhhbSwgc2Fucy1zZXJpZjsgbGluZS1oZWlnaHQ6IDIycHg7IHRleHQtYWxpZ246IGNlbnRlcjsiPg0KCQkJCQkJPC9wPjxkaXYgc3R5bGU9ImZvbnQtZmFtaWx5OiBIZWx2ZXRpY2EsICZxdW90O0hlbHZldGljYSBOZXVlJnF1b3Q7LCBBcmlhbCwgR290aGFtLCBzYW5zLXNlcmlmOyBsaW5lLWhlaWdodDogMTE1JTsgdGV4dC1hbGlnbjogY2VudGVyOyI-DQoJCQkJCQkJPHNwYW4gc3R5bGU9ImZvbnQtc2l6ZTo5cHg7Ij48c3BhbiBzdHlsZT0iZm9udC1mYW1pbHk6IEhlbHZldGljYSwgJnF1b3Q7SGVsdmV0aWNhIE5ldWUmcXVvdDssIEFyaWFsLCBHb3RoYW0sIHNhbnMtc2VyaWY7Ij48c3BhbiBzdHlsZT0iY29sb3I6IHJnYigwLCAwLCAwKTsgZm9udC13ZWlnaHQ6IGxpZ2h0ZXI7Ij48Yj5BIGNvbXBsZXRlJm5ic3A7VGF3a2lmeSBwcm9maWxlIGlzIHJlcXVpcmVkIHRvIGpvaW4gdGhlIG5ldHdvcmsgYXMgYSBtZW1iZXI8L2I-Ljxicj4NCgkJCQkJCQlNZW1iZXJzIGFyZSBzY3JlZW5lZCBieSBtYXRjaG1ha2VycyB3aGVuIHByb2ZpbGUgc3VnZ2VzdHMgY29tcGF0aWJpbGl0eSw8YnI-DQoJCQkJCQkJYW5kIG1hdGNoZWQgaWYgc2VsZWN0ZWQgdG8gbWVldCBwYXJ0aWN1bGFyIGNsaWVudChzKS4gVmFsdWUgJDk5OyByZWd1bGFyIHRlcm1zPGJyPg0KCQkJCQkJCWFuZCBjb25kaXRpb25zIGFwcGx5LiZuYnNwOzwvc3Bhbj48L3NwYW4-PC9zcGFuPjwvZGl2PjwvYmxvY2txdW90ZT48L2Rpdj48L3RkPjwvdHI-PC90YWJsZT48L3RkPjwvdHI-PC90YWJsZT48L3RkPjwvdHI-PC90YWJsZT4NCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICANCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD4NCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI-DQogICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI-DQogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBhbGlnbj0ibGVmdCIgY2xhc3M9IiIgdmFsaWduPSJ0b3AiPg0KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0YWJsZSBjZWxscGFkZGluZz0iMCIgY2VsbHNwYWNpbmc9IjAiIHdpZHRoPSIxMDAlIiByb2xlPSJwcmVzZW50YXRpb24iIHN0eWxlPSJiYWNrZ3JvdW5kLWNvbG9yOiB0cmFuc3BhcmVudDsgYm9yZGVyOiAxcHggc29saWQgdHJhbnNwYXJlbnQ7IG1pbi13aWR0aDogMTAwJTsgIiBjbGFzcz0ic2xvdC1zdHlsaW5nIj48dHI-PHRkIHN0eWxlPSJwYWRkaW5nOiAyMHB4IDBweCAwcHg7ICIgY2xhc3M9InNsb3Qtc3R5bGluZyBjYW1hcmtlci1pbm5lciI-PHRhYmxlIGNlbGxwYWRkaW5nPSIwIiBjZWxsc3BhY2luZz0iMCIgd2lkdGg9IjEwMCUiIHJvbGU9InByZXNlbnRhdGlvbiIgc3R5bGU9InRleHQtYWxpZ246IGNlbnRlcjsgYmFja2dyb3VuZC1jb2xvcjogdHJhbnNwYXJlbnQ7IG1pbi13aWR0aDogMTAwJTsgIiBjbGFzcz0ic3R5bGluZ2Jsb2NrLWNvbnRlbnQtd3JhcHBlciI-PHRyPjx0ZCBzdHlsZT0icGFkZGluZzogMzBweCAwcHggNXB4OyAiIGNsYXNzPSJzdHlsaW5nYmxvY2stY29udGVudC13cmFwcGVyIGNhbWFya2VyLWlubmVyIiBhbGlnbj0iY2VudGVyIj48ZGl2IHN0eWxlPSJ0ZXh0LWFsaWduOiBjZW50ZXI7Ij4NCgk8c3BhbiBzdHlsZT0iZm9udC1zaXplOjEzcHg7Ij48dT48c3BhbiBzdHlsZT0idGV4dC1kZWNvcmF0aW9uOiBub25lOyI-PGEgICBkYXRhLWxpbmt0bz0iaHR0cHM6Ly8iIGhyZWY9Imh0dHBzOi8vY2xpY2suY29tbXVuaWNhdGlvbnMudGF3a2lmeS5jb20vP3FzPTQwOTk2NjI2OTI3NDc2OTM0ZDBmNTU2NzcxOGQ4MzUwN2ZmZmI0ZDhlYTJhZjg4OTk0YjNlNjk0NjcxNTc2YmI3ZWQ5Nzc5MzhiNTY5YjMxM2Q4MGVmMjQ1ODk2OWI4ZjA0MmY5ZDUyZWQxZTYyY2Y1ZjMxYjZlOGM1YjJhN2Q5IiBzdHlsZT0iY29sb3I6IzgwODA4MDt0ZXh0LWRlY29yYXRpb246bm9uZTsiIHRpdGxlPSJUQVdLSUZZLkNPTSI-PHNwYW4gc3R5bGU9ImNvbG9yOiM3Nzc3Nzc7Ij5UQVdLSUZZLkNPTTwvc3Bhbj48L2E-PC9zcGFuPjwvdT48c3BhbiBzdHlsZT0iY29sb3I6Izc3Nzc3NzsiPiZuYnNwOyAmbmJzcDt8Jm5ic3A7Jm5ic3A7PC9zcGFuPjx1PjxhICAgZGF0YS1saW5rdG89Imh0dHBzOi8vIiBocmVmPSJodHRwczovL2NsaWNrLmNvbW11bmljYXRpb25zLnRhd2tpZnkuY29tLz9xcz00MDk5NjYyNjkyNzQ3NjkzODc5MDA2MTIzYjNlYWQ2NTVmZDcxMGVlMmRiYjFkZjk3OTUzOGZmMTE5NjgxNjY1OTkzYjRhMDcwOGZmOGFiMWU1ZGRhNTE4NmFlNDMwZWNkMzA4YzY5OWRhMWY3NzQ1YTEwOWI0MzgzNzcyYWMyMCIgc3R5bGU9ImNvbG9yOiM4MDgwODA7dGV4dC1kZWNvcmF0aW9uOm5vbmU7IiB0aXRsZT0iTE9WRSBTVE9SSUVTIj48c3BhbiBzdHlsZT0iY29sb3I6Izc3Nzc3NzsiPkNPVVBMRVM8L3NwYW4-PC9hPjwvdT48c3BhbiBzdHlsZT0iY29sb3I6Izc3Nzc3NzsiPiZuYnNwOyAmbmJzcDt8Jm5ic3A7Jm5ic3A7PC9zcGFuPjx1PjxzcGFuIHN0eWxlPSJ0ZXh0LWRlY29yYXRpb246IG5vbmU7Ij4NCjxhICAgZGF0YS1saW5rdG89Imh0dHBzOi8vIiBocmVmPSJodHRwczovL2NsaWNrLmNvbW11bmljYXRpb25zLnRhd2tpZnkuY29tLz9xcz00MDk5NjYyNjkyNzQ3NjkzMTY4MmM5YmUyMGYyNzIwZDdiOWNhN2JjMGZiMmYwNTNjZmFjOGQwYTFmNmRlYWVjMjQwY2RkYjAwMGM1OTMyNmRmYjI0MjljN2U3N2NlMGU5MmU2MmRmODBjZjA4MjIxNTQzYWYyZWUyYTBjYTExYyIgc3R5bGU9ImNvbG9yOiM4MDgwODA7dGV4dC1kZWNvcmF0aW9uOm5vbmU7IiB0aXRsZT0iQ09OVEFDVCBVUyI-DQo8c3BhbiBzdHlsZT0iY29sb3I6Izc3Nzc3NzsiPkNPTlRBQ1Q8L3NwYW4-PC9hPjwvc3Bhbj48L3U-PC9zcGFuPjwvZGl2PjwvdGQ-PC90cj48L3RhYmxlPjx0YWJsZSBjZWxscGFkZGluZz0iMCIgY2VsbHNwYWNpbmc9IjAiIHdpZHRoPSIxMDAlIiByb2xlPSJwcmVzZW50YXRpb24iIHN0eWxlPSJtaW4td2lkdGg6IDEwMCU7ICIgY2xhc3M9InN0eWxpbmdibG9jay1jb250ZW50LXdyYXBwZXIiPjx0cj48dGQgc3R5bGU9InBhZGRpbmctdG9wOiAxMHB4OyBwYWRkaW5nLXJpZ2h0OiAxMHB4OyBwYWRkaW5nLWxlZnQ6IDEwcHg7ICIgY2xhc3M9InN0eWxpbmdibG9jay1jb250ZW50LXdyYXBwZXIgY2FtYXJrZXItaW5uZXIiPjxkaXYgc3R5bGU9InRleHQtYWxpZ246IGNlbnRlcjsgbGluZS1oZWlnaHQ6IDE1MCU7Ij4NCgk8c3BhbiBzdHlsZT0iZm9udC1zaXplOjExcHg7Ij43NDMgQ2xlbWVudGluYSBTdHJlZXQgLSZuYnNwO1NhbiBGcmFuY2lzY28mbmJzcDtDQSwmbmJzcDs5NDEwMzwvc3Bhbj48L2Rpdj48L3RkPjwvdHI-PC90YWJsZT48dGFibGUgY2VsbHBhZGRpbmc9IjAiIGNlbGxzcGFjaW5nPSIwIiB3aWR0aD0iMTAwJSIgcm9sZT0icHJlc2VudGF0aW9uIiBzdHlsZT0iYmFja2dyb3VuZC1jb2xvcjogdHJhbnNwYXJlbnQ7IG1pbi13aWR0aDogMTAwJTsgIiBjbGFzcz0ic3R5bGluZ2Jsb2NrLWNvbnRlbnQtd3JhcHBlciI-PHRyPjx0ZCBzdHlsZT0icGFkZGluZzogMHB4IDEwcHggMTBweDsgIiBjbGFzcz0ic3R5bGluZ2Jsb2NrLWNvbnRlbnQtd3JhcHBlciBjYW1hcmtlci1pbm5lciI-PGRpdiBzdHlsZT0idGV4dC1hbGlnbjogY2VudGVyOyBsaW5lLWhlaWdodDogMTUwJTsiPg0KCTxzcGFuIHN0eWxlPSJmb250LXNpemU6OXB4OyI-PHU-PGEgICBkYXRhLWxpbmt0bz0ib3RoZXIiIGhyZWY9Imh0dHBzOi8vY2xpY2suY29tbXVuaWNhdGlvbnMudGF3a2lmeS5jb20vcHJvZmlsZV9jZW50ZXIuYXNweD9xcz0xYTVjMjlhMmM0NWExODYzM2MyOWJhNDdiOTM2MTQ5MDAwMTdjYjlkYzI1ZWQyYjlkNWZlOTM3MjhmZWY5N2MwY2Y4NmQyN2M4ODNiMDdjZDFiOTkwODA1NDMzZWEzNGEzYTMyYjUyNjQyYWRmYmVhMjgwYmNlMTcyMjNiMDFkZGFjNDFlMjE1YzNiMDI3YjgiIHN0eWxlPSJjb2xvcjojODA4MDgwO3RleHQtZGVjb3JhdGlvbjpub25lOyIgdGl0bGU9Ik1hbmFnZSBQcmVmZXJlbmNlcyAiPjxzcGFuIHN0eWxlPSJjb2xvcjojNzc3Nzc3OyI-TUFOQUdFIFBSRUZFUkVOQ0VTPC9zcGFuPjwvYT48L3U-PC9zcGFuPjwvZGl2PjwvdGQ-PC90cj48L3RhYmxlPjx0YWJsZSBjZWxscGFkZGluZz0iMCIgY2VsbHNwYWNpbmc9IjAiIHdpZHRoPSIxMDAlIiByb2xlPSJwcmVzZW50YXRpb24iIHN0eWxlPSJiYWNrZ3JvdW5kLWNvbG9yOiB0cmFuc3BhcmVudDsgbWluLXdpZHRoOiAxMDAlOyAiIGNsYXNzPSJzdHlsaW5nYmxvY2stY29udGVudC13cmFwcGVyIj48dHI-PHRkIHN0eWxlPSJwYWRkaW5nOiAwcHggMHB4IDE2cHg7ICIgY2xhc3M9InN0eWxpbmdibG9jay1jb250ZW50LXdyYXBwZXIgY2FtYXJrZXItaW5uZXIiPjx0YWJsZSB3aWR0aD0iMTAwJSIgY2VsbHNwYWNpbmc9IjAiIGNlbGxwYWRkaW5nPSIwIiByb2xlPSJwcmVzZW50YXRpb24iPjx0cj48dGQgYWxpZ249ImNlbnRlciI-DQo8aW1nIGRhdGEtYXNzZXRpZD0iNTM3MDIiIHNyYz0iaHR0cHM6Ly9pbWFnZS5jb21tdW5pY2F0aW9ucy50YXdraWZ5LmNvbS9saWIvZmUzOTE1NzA3NTY0MDY3YjcyMTI3MC9tLzEvNzFkYjQxMDMtY2MwZi00N2ZkLWE1YjctMDFiMjU2NWVjM2NlLnBuZyIgYWx0PSIiIHdpZHRoPSIxMDIyIiBzdHlsZT0iZGlzcGxheTogYmxvY2s7IHBhZGRpbmc6IDBweDsgdGV4dC1hbGlnbjogY2VudGVyOyBoZWlnaHQ6IGF1dG87IHdpZHRoOiAxMDAlOyBib3JkZXI6IDBweDsiPjwvdGQ-PC90cj48L3RhYmxlPjwvdGQ-PC90cj48L3RhYmxlPjwvdGQ-PC90cj48L3RhYmxlPg0KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIA0KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RkPg0KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj4NCiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RhYmxlPg0KICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RkPg0KICAgICAgICAgICAgICAgICAgICAgICAgPC90cj4NCiAgICAgICAgICAgICAgICAgICAgICA8L3RhYmxlPg0KICAgICAgICAgICAgICAgICAgICA8L3RkPg0KICAgICAgICAgICAgICAgICAgPC90cj4NCiAgICAgICAgICAgICAgICA8L3RhYmxlPg0KICAgICAgICAgICAgICA8L3RkPg0KICAgICAgICAgICAgPC90cj4NCiAgICAgICAgICA8L3RhYmxlPg0KICAgICAgICA8L3RkPg0KICAgICAgPC90cj4NCiAgICAgIDx0cj4NCiAgICAgICAgPHRkIHZhbGlnbj0idG9wIj4NCiAgICAgICAgICAgDQogICAgICAgIDwvdGQ-DQogICAgICA8L3RyPg0KICAgIDwvdGFibGU-DQogIDwvYm9keT4NCjwvaHRtbD4NCg=="
        }
      }
    ]
  },
  "sizeEstimate": 29780,
  "historyId": "14431107",
  "internalDate": "1613348807000"
}
;