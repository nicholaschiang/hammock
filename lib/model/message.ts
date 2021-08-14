import {
  Newsletter,
  NewsletterInterface,
  NewsletterJSON,
  isNewsletterJSON,
} from 'lib/model/newsletter';
import { isArray, isDateJSON, isJSON } from 'lib/model/json';
import clone from 'lib/utils/clone';
import construct from 'lib/model/construct';
import definedVals from 'lib/model/defined-vals';

/**
 * @typedef Format - The format or amount of data that should be fetched.
 * @see {@link https://developers.google.com/gmail/api/reference/rest/v1/Format}
 */
export type Format = 'MINIMAL' | 'FULL' | 'RAW' | 'METADATA';

/**
 * @typedef {Object} HighlightInterface
 * @property start - The xpath pointing to the range start element.
 * @property end - The xpath pointing to the range end element.
 * @property startOffset - The offset from the start of the start element and
 * the start of the highlight (in characters).
 * @property endOffset - The offset from the start of the end element and the
 * end of the highlight (in characters).
 * @property id - The highlight's ID. Used when an xpath range has to be styled
 * using multiple `<mark>` tags instead of just one.
 * @property text - The selected text content.
 * @property [deleted] - Whether or not this highlight is deleted. We have to
 * keep these highlights and their corresponding `<mark>` tags b/c otherwise we
 * have the possibility of messing up the xpath selectors of highlights made
 * after this one.
 */
export interface Highlight {
  start: string;
  startOffset: number;
  end: string;
  endOffset: number;
  id: string;
  text: string;
  deleted?: boolean;
}

export function isHighlight(highlight: unknown): highlight is Highlight {
  if (!isJSON(highlight)) return false;
  return (
    typeof highlight.start === 'string' &&
    typeof highlight.startOffset === 'number' &&
    typeof highlight.start === 'string' &&
    typeof highlight.endOffset === 'number' &&
    typeof highlight.id === 'string' &&
    typeof highlight.text === 'string' &&
    (highlight.deleted === undefined || typeof highlight.deleted === 'boolean')
  );
}

export interface MessageInterface extends NewsletterInterface {
  id: string;
  user: number;
  date: Date;
  subject: string;
  snippet: string;
  raw: string;
  html: string;
  archived: boolean;
  scroll: number;
  time: number;
  highlights: Highlight[];
}

export interface DBMessage {
  newsletter: string;
  user: number;
  id: string;
  date: string;
  subject: string;
  snippet: string;
  raw: string;
  html: string;
  archived: boolean;
  scroll: number;
  time: number;
}
export interface DBHighlight {
  message: string;
  id: number;
  start: string;
  startOffset: number;
  end: string;
  endOffset: number;
  text: string;
  deleted: boolean;
}

export type MessageJSON = Omit<MessageInterface, keyof Newsletter | 'date'> &
  NewsletterJSON & { date: string };

export function isMessageJSON(json: unknown): json is MessageJSON {
  const stringFields = ['id', 'subject', 'snippet', 'raw', 'html'];
  const numberFields = ['scroll', 'time'];

  if (!isNewsletterJSON(json)) return false;
  if (!isJSON(json)) return false;
  if (!isDateJSON(json.date)) return false;
  if (stringFields.some((key) => typeof json[key] !== 'string')) return false;
  if (numberFields.some((key) => typeof json[key] !== 'number')) return false;
  if (typeof json.archived !== 'boolean') return false;
  if (!isArray(json.highlights, isHighlight)) return false;
  return true;
}

export class Message extends Newsletter implements MessageInterface {
  public id = '';

  public user = 0;

  public date: Date = new Date();

  public subject = '';

  public snippet = '';

  public raw = '';

  public html = '';

  public archived = false;

  public scroll = 0;

  public time = 0;

  public highlights: Highlight[] = [];

  public constructor(message: Partial<MessageInterface> = {}) {
    super(message);
    construct<MessageInterface, NewsletterInterface>(
      this,
      message,
      new Newsletter()
    );
  }

  public get clone(): Message {
    return new Message(clone(this));
  }

  public toString(): string {
    return `Message (${this.id})`;
  }

  public toJSON(): MessageJSON {
    return definedVals({
      ...this,
      ...super.toJSON(),
      date: this.date.toJSON(),
    });
  }

  public static fromJSON(json: MessageJSON): Message {
    return new Message({
      ...json,
      ...Newsletter.fromJSON(json),
      date: new Date(json.date),
    });
  }

  public toDB(): DBMessage {
    return {
      newsletter: this.from.email,
      user: this.user,
      id: this.id,
      date: this.date.toISOString(),
      subject: this.subject,
      snippet: this.snippet,
      raw: this.raw,
      html: this.html,
      archived: this.archived,
      scroll: this.scroll,
      time: this.time,
    };
  }

  public static fromDB(record: DBMessage): Message {
    return new Message({
      from: { name: '', email: record.newsletter, photo: '' },
      user: record.user,
      id: record.id,
      date: new Date(record.date),
      subject: record.subject,
      snippet: record.snippet,
      raw: record.raw,
      html: record.html,
      archived: record.archived,
      scroll: record.scroll,
      time: record.time,
    });
  }

  public toSegment(): Record<string, unknown> {
    return {
      ...super.toSegment(),
      id: this.id,
      date: this.date,
      subject: this.subject,
      snippet: this.snippet,
      archived: this.archived,
      scroll: this.scroll,
      time: this.time,
    };
  }
}
