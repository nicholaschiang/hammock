import { DocumentSnapshot, Timestamp } from 'lib/api/firebase';
import {
  Subscription,
  SubscriptionFirestore,
  SubscriptionInterface,
  SubscriptionJSON,
  isSubscriptionJSON,
} from 'lib/model/subscription';
import { isDateJSON, isJSON } from 'lib/model/json';
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
}

export type MessageJSON = Omit<MessageInterface, keyof Subscription | 'date'> &
  SubscriptionJSON & { date: string };
export type MessageFirestore = Omit<
  MessageInterface,
  keyof Subscription | 'date'
> &
  SubscriptionFirestore & { date: Timestamp; quickRead: boolean; resume: boolean };

export function isMessageJSON(json: unknown): json is MessageJSON {
  const stringFields = ['id', 'subject', 'snippet', 'raw', 'html'];
  const numberFields = ['scroll', 'time'];

  if (!isSubscriptionJSON(json)) return false;
  if (!isJSON(json)) return false;
  if (!isDateJSON(json.date)) return false;
  if (stringFields.some((key) => typeof json[key] !== 'string')) return false;
  if (numberFields.some((key) => typeof json[key] !== 'number')) return false;
  if (typeof json.archived !== 'boolean') return false;
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

  public set resume(resume: boolean) {}

  public set quickRead(quickRead: boolean) {}

  public get resume(): boolean {
    return this.scroll > 0;
  }

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
    return definedVals({
      ...this,
      ...super.toFirestore(),
      date: (this.date as unknown) as Timestamp,
      quickRead: this.quickRead,
      resume: this.resume,
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
