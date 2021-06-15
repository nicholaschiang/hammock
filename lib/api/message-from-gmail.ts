import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import atob from 'atob';
import createDOMPurify from 'dompurify';
import he from 'he';
import { htmlToText } from 'html-to-text';
import readingTime from 'reading-time';
import utf8 from 'utf8';

import { Category, Contact } from 'lib/model/subscription';
import { GmailMessage } from 'lib/api/gmail';
import { Message } from 'lib/model/message';
import whitelist from 'lib/whitelist.json';

function hasWhitelistDomain(email: string) {
  const domain = email.slice(email.indexOf('@') + 1);
  return [
    'substack.com',
    'every.to',
    'stratechery.com',
    '2pml.com',
    'cassidoo.co',
    'e.newyorktimes.com',
    'atlasobscura.com',
    'e.economist.com',
    'getrevue.co',
  ].includes(domain.toLowerCase());
}

function getIcon(name: string, email: string): string {
  const result = whitelist.find((l) => l.email.toLowerCase() === email.toLowerCase() || l.name.toLowerCase() === name.toLowerCase());
  if (result?.icon) return result.icon;
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

function getRawHTML(message: GmailMessage): string {
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

export function parseRawHTML(raw: string): { time: number; html: string } {
  const window = new JSDOM('').window as unknown as Window;
  const DOMPurify = createDOMPurify(window);

  // Open all links in a new tab and prevent security issues.
  // @see {@link https://github.com/readhammock/hammock/issues/7}
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A' && 'target' in node) {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });

  // If an image is >400px wide, we should set it's width to 100%.
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'IMG' && Number(node.getAttribute('width')) > 400) 
      node.setAttribute('width', '100%');
  });

  // Remove tags that don't contain any content. For example, Benedict Evan's
  // newsletter uses empty `<span>` tags to increase margin. We remove those.
  // @see {@link https://github.com/cure53/DOMPurify/issues/169}
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    const tags = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'B', 'SPAN', 'STRONG', 'EM'];
    if (tags.includes(node.tagName) && !node.hasChildNodes()) node.remove();
  });

  // Don't allow HTML table tags that essentially only used for formatting.
  // @see {@link https://linear.app/readhammock/issue/PD-52}
  const options = { FORBID_TAGS: ['table', 'tbody', 'tr', 'td'] };
  const html = DOMPurify.sanitize(raw, options);
  const text = htmlToText(html, {
    wordwrap: false,
    tags: {
      a: { options: { ignoreHref: true } },
      img: { format: 'skip' },
    },
  });
  const clean = new JSDOM(html).window.document;
  const article = new Readability(clean, { charThreshold: 10 }).parse();
  const time = Math.round(readingTime(article?.textContent || text).minutes);

  // Remove non-breaking spaces (i.e. the `&nbsp;` HTML entities).
  return { time, html: (article?.content || html).replace(/&nbsp;/g, '') };
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
  if (whitelist.some((l) => l.email.toLowerCase() === email.toLowerCase() || l.name.toLowerCase() === name.toLowerCase()) || hasWhitelistDomain(email)) {
    category = 'important';
  } else if (getHeader('list-unsubscribe')) {
    category = 'other';
  }

  const raw = getRawHTML(gmailMessage);
  const { html, time } = parseRawHTML(raw);

  return new Message({
    raw,
    html,
    time,
    category,
    id: gmailMessage.id || '',
    date: new Date(Number(gmailMessage.internalDate)),
    from: { name, email, photo },
    subject: getHeader('subject'),
    snippet: getSnippet(gmailMessage),
  });
}
