import { APIError } from 'lib/model/error';
import clone from 'lib/utils/clone';
import construct from 'lib/model/construct';
import definedVals from 'lib/model/defined-vals';
import { isJSON } from 'lib/model/json';

export interface Contact {
  name: string;
  email: string;
  photo: string;
}

export function isContact(contact: unknown): contact is Contact {
  const stringFields = ['name', 'email', 'photo'];
  if (!isJSON(contact)) return false;
  return stringFields.every((key) => typeof contact[key] === 'string');
}

export type Category = 'important' | 'other';

export function isCategory(category: unknown): category is Category {
  if (typeof category !== 'string') return false;
  return ['important', 'other'].includes(category);
}

/**
 * @typedef {Object} SubscriptionInterface
 * @property from - Who the newsletter is from (their name, email, and photo).
 * @property category - Either "important" (a known newsletter listed on our
 * whitelist or with a whitelisted sender domain) or "other" (any email that
 * contains the `list-unsubscribe` header) or missing (not a newsletter).
 * @property favorite - Whether or not this is a "favorite" newsletter.
 */
export interface SubscriptionInterface {
  from: Contact;
  category: Category;
  favorite: boolean;
}

export interface DBNewsletter {
  name: string;
  email: string;
  photo: string;
  category: string;
}
export type DBCategory = 'important' | 'other';
export interface DBSubscription {
  user: number;
  newsletter: string;
  category: DBCategory;
  favorite: boolean;
}

export type SubscriptionJSON = SubscriptionInterface;

export function isSubscriptionJSON(json: unknown): json is SubscriptionJSON {
  if (!isJSON(json)) throw new APIError('Expected valid JSON body', 400);
  if (!isContact(json.from))
    throw new APIError('Expected valid contact in "from" field', 400);
  if (!isCategory(json.category))
    throw new APIError('Expected category of "important" or "other"', 400);
  if (typeof json.favorite !== 'boolean')
    throw new APIError('Expected favorite of type boolean', 400);
  return true;
}

export class Subscription implements SubscriptionInterface {
  public from = { name: '', email: '', photo: '' };

  public category: Category = 'other';

  public favorite = false;

  public constructor(subscription: Partial<SubscriptionInterface> = {}) {
    construct<SubscriptionInterface>(this, subscription);
  }

  public get clone(): Subscription {
    return new Subscription(clone(this));
  }

  public toString(): string {
    return `Subscription from ${this.from.name} (${this.from.email})`;
  }

  public toJSON(): SubscriptionJSON {
    return definedVals(this);
  }

  public static fromJSON(json: SubscriptionJSON): Subscription {
    return new Subscription(json);
  }

  public toDB(): DBSubscription {
    return {
      name: this.from.name,
      email: this.from.email,
      photo: this.from.photo,
      category: this.category,
      favorite: this.favorite,
    };
  }

  public static fromDB(record: DBSubscription): Subscription {
    return new Subscription({
      from: {
        name: record.name,
        email: record.email,
        photo: record.photo,
      },
      category: record.category,
      favorite: record.favorite,
    });
  }

  public toSegment(): Record<string, unknown> {
    return {
      from: `${this.from.name} <${this.from.email}>`,
      category: this.category,
    };
  }
}
