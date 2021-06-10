import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import atob from 'atob';
import he from 'he';
import { htmlToText } from 'html-to-text';
import readingTime from 'reading-time';
import utf8 from 'utf8';

import { Category, Contact } from 'lib/model/subscription';
import { hasWhitelistDomain, whitelist } from 'lib/whitelist';
import { GmailMessage } from 'lib/api/gmail';
import { Message } from 'lib/model/message';
import xss from 'lib/api/xss';

function getIcon(name: string, email: string): string {
  const result = whitelist[name.toLowerCase()];
  if (result && result !== true && result.asset_url) return result.asset_url;
  let domain = email.slice(email.indexOf('@') + 1);
  if (domain.startsWith('e.')) {
    domain = domain.slice(2);
  }
  if (domain.startsWith('email.')) {
    domain = domain.slice(6);
  }
  if (domain.startsWith('mail.')) {
    domain = domain.slice(5);
  }
  return `https://www.google.com/s2/favicons?sz=64&domain_url=${domain}`;
}

/**
 * Parses the given from header (from Gmail's API) into a name and email.
 * @param The from header from Gmail's API.
 * @return The from header parsed into name and email strings.
 */
function parseFrom(from: string): Contact {
  const matches = /(.*) <(.*)>/.exec(from);
  if (!matches) return { name: from, email: from, photo: '' };
  let name = matches[1].trim();
  if (name.startsWith('"')) {
    name = name.substr(1);
  }
  if (name.endsWith('"')) {
    name = name.substr(0, name.length - 1);
  }
  const email = matches[2].toLowerCase();
  return { name, email, photo: getIcon(name, email) };
}

function getMessageBody(message: GmailMessage): string {
  let bodyData = '';
  if (message?.payload?.mimeType === 'text/html') {
    bodyData = message?.payload?.body?.data || '';
  } else {
    // Probably multipart?
    const parts = message.payload?.parts || [];
    const htmlPart = parts.find((p) => p.mimeType === 'text/html');
    const textPart = parts.find((p) => p.mimeType === 'text/plain');
    if (htmlPart) {
      bodyData = htmlPart.body?.data || '';
    } else if (textPart) {
      bodyData = textPart.body?.data || '';
    } else if ((message.payload?.parts || []).length > 0) {
      // Super multipart?
      const subpart = (message.payload?.parts || [])[0];
      const subparts = subpart.parts;
      const htmlSubart = subparts?.find((p) => p.mimeType === 'text/html');
      const textSubpart = subparts?.find((p) => p.mimeType === 'text/plain');
      if (htmlSubart) {
        bodyData = htmlSubart.body?.data || '';
      } else if (textSubpart) {
        bodyData = textSubpart.body?.data || '';
      }
    }
  }
  return utf8.decode(atob(bodyData.replace(/-/g, '+').replace(/_/g, '/')));
}

function getSnippet(message: GmailMessage): string {
  if (!message.snippet) return '';
  let cleanedUp: string = he.decode(message.snippet);
  if (!cleanedUp.endsWith('.')) cleanedUp += '...';
  return cleanedUp;
}

/**
 * Converts a GmailMessage into our Message data type.
 * @param gmailMessage - The GmailMessage to convert.
 * @return The converted message (with sanitized HTML and all).
 */
export default function messageFromGmail(gmailMessage: GmailMessage): Message {
  function getHeader(header: string): string {
    return (
      gmailMessage.payload?.headers?.find(
        (h) => h?.name?.toLowerCase() === header
      )?.value || ''
    );
  }

  const { name, email, photo } = parseFrom(getHeader('from'));
  let category: Category | undefined;
  if (whitelist[name.toLowerCase()] || hasWhitelistDomain(email)) {
    category = 'important';
  } else if (getHeader('list-unsubscribe')) {
    category = 'other';
  }

  const html = xss.process(getMessageBody(gmailMessage));
  const text = htmlToText(html, {
    wordwrap: false,
    tags: {
      a: { options: { ignoreHref: true } },
      img: { format: 'skip' },
    },
  });
  const article = new Readability(new JSDOM(html).window.document).parse();

  return new Message({
    category,
    html: article?.content || html,
    id: gmailMessage.id || '',
    date: new Date(Number(gmailMessage.internalDate)),
    from: { name, email, photo },
    subject: getHeader('subject'),
    snippet: getSnippet(gmailMessage),
    time: Math.round(readingTime(article?.textContent || text).minutes),
  });
}
