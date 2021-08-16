import {
  DBCategory,
  Subscription,
  SubscriptionInterface,
  SubscriptionJSON,
  isSubscriptionJSON,
} from 'lib/model/subscription';
import { DBHighlight, Highlight, isHighlight } from 'lib/model/highlight';
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
 * @typedef {Object} MessageInterface
 * @extends SubscriptionInterface
 * @property id - The message's Gmail-assigned ID (we reuse it in our database).
 * @property date - When the message was sent (i.e. Gmail's `internalDate`).
 * @property subject - The message's subject line.
 * @property snippet - The message's snippet (a short part of message text).
 * @property raw - The message's original unsanitized, un-readabilitied HTML.
 * @property html - The message's sanitized HTML (can be used directly in DOM).
 * @property archived - Whether or not the email has been archived.
 * @property scroll - The user's scroll position in reading this email.
 * @property time - The message's estimated reading time (in minutes).
 * @property highlights - The message's highlights.
 */
export interface MessageInterface extends SubscriptionInterface {
  user: string;
  id: string;
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
  user: number;
  id: string;
  name: string;
  email: string;
  photo: string;
  category: DBCategory;
  favorite: boolean;
  date: string;
  subject: string;
  snippet: string;
  raw: string;
  html: string;
  archived: boolean;
  scroll: number;
  time: number;
  highlights: DBHighlight[];
}

export type MessageJSON = Omit<MessageInterface, keyof Subscription | 'date'> &
  SubscriptionJSON & { date: string };

export function isMessageJSON(json: unknown): json is MessageJSON {
  const stringFields = ['id', 'subject', 'snippet', 'raw', 'html'];
  const numberFields = ['scroll', 'time'];

  if (!isSubscriptionJSON(json)) return false;
  if (!isJSON(json)) return false;
  if (!isDateJSON(json.date)) return false;
  if (stringFields.some((key) => typeof json[key] !== 'string')) return false;
  if (numberFields.some((key) => typeof json[key] !== 'number')) return false;
  if (typeof json.archived !== 'boolean') return false;
  if (!isArray(json.highlights, isHighlight)) return false;
  return true;
}

export class Message extends Subscription implements MessageInterface {
  public user = '';

  public id = '';

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
    construct<MessageInterface, SubscriptionInterface>(
      this,
      message,
      new Subscription()
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
      ...Subscription.fromJSON(json),
      date: new Date(json.date),
    });
  }

  public toDB(): DBMessage {
    return {
      user: Number(this.user),
      id: this.id,
      name: this.from.name,
      email: this.from.email,
      photo: this.from.photo,
      category: this.category,
      favorite: this.favorite,
      date: this.date.toISOString(),
      subject: this.subject,
      snippet: this.snippet,
      raw: this.raw,
      html: this.html,
      archived: this.archived,
      scroll: this.scroll,
      time: this.time,
      highlights: this.highlights.map((h) => ({ deleted: false, ...h })),
    };
  }

  public static fromDB(record: DBMessage): Message {
    return new Message({
      user: record.user.toString(),
      id: record.id,
      from: {
        name: record.name,
        email: record.email,
        photo: record.photo,
      },
      category: record.category,
      favorite: record.favorite,
      date: new Date(record.date),
      subject: record.subject,
      snippet: record.snippet,
      raw: record.raw,
      html: record.html,
      archived: record.archived,
      scroll: record.scroll,
      time: record.time,
      highlights: record.highlights,
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
