import { DBCategory, DBContact } from 'lib/model/user';
import { DocumentSnapshot, Timestamp } from 'lib/api/firebase';
import {
  Subscription,
  SubscriptionFirestore,
  SubscriptionInterface,
  SubscriptionJSON,
  isSubscriptionJSON,
} from 'lib/model/subscription';
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

export interface DBHighlight {
  id: string;
  start: string;
  startOffset: number;
  end: string;
  endOffset: number;
  text: string;
  deleted: boolean;
}
export interface DBMessage {
  user: number;
  id: string;
  from: DBContact;
  category: DBCategory;
  favorite: boolean;
  date: Date;
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
export type MessageFirestore = Omit<
  MessageInterface,
  keyof Subscription | 'date'
> &
  SubscriptionFirestore & {
    date: Timestamp;
    quickRead: boolean;
    resume: boolean;
  };

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

  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-empty-function
  public set resume(resume: boolean) {}

  public get resume(): boolean {
    return this.scroll > 0;
  }

  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-empty-function
  public set quickRead(quickRead: boolean) {}

  public get quickRead(): boolean {
    return this.time < 5;
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

  public toFirestore(): MessageFirestore {
    // We don't store the actual message content (subject, snippet, html) in our
    // database. Instead, we fetch that data at runtime and only store metadata.
    return definedVals({
      ...this,
      ...super.toFirestore(),
      date: this.date as unknown as Timestamp,
    });
  }

  public static fromFirestore(data: MessageFirestore): Message {
    return new Message({
      ...data,
      ...Subscription.fromFirestore(data),
      date: data.date.toDate(),
    });
  }

  public static fromFirestoreDoc(snapshot: DocumentSnapshot): Message {
    if (!snapshot.exists) return new Message();
    const overrides = definedVals({
      created: snapshot.createTime?.toDate(),
      updated: snapshot.updateTime?.toDate(),
      id: snapshot.id,
    });
    const message = Message.fromFirestore(snapshot.data() as MessageFirestore);
    return new Message({ ...message, ...overrides });
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
