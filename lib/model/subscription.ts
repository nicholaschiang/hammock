import { DocumentSnapshot } from 'lib/api/firebase';
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
 * @property [category] - Either "important" (a known newsletter listed on our
 * whitelist or with a whitelisted sender domain) or "other" (any email that
 * contains the `list-unsubscribe` header) or missing (not a newsletter).
 * @property favorite - Whether or not this is a "favorite" newsletter.
 */
export interface SubscriptionInterface {
  from: Contact;
  category?: Category;
  favorite: boolean;
}

export type SubscriptionJSON = SubscriptionInterface;
export type SubscriptionFirestore = SubscriptionInterface;

export function isSubscriptionJSON(json: unknown): json is SubscriptionJSON {
  if (!isJSON(json)) return false;
  if (!isContact(json.from)) return false;
  if (json.category && !isCategory(json.category)) return false;
  if (typeof json.favorite !== 'boolean') return false;
  return true;
}

export class Subscription implements SubscriptionInterface {
  public from = { name: '', email: '', photo: '' };

  public category?: Category;

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

  public toFirestore(): SubscriptionFirestore {
    return definedVals(this);
  }

  public static fromFirestore(data: SubscriptionFirestore): Subscription {
    return new Subscription(data);
  }

  public static fromFirestoreDoc(snapshot: DocumentSnapshot): Subscription {
    if (!snapshot.exists) return new Subscription();
    const overrides = definedVals({ id: snapshot.id });
    const subscription = Subscription.fromFirestore(
      snapshot.data() as SubscriptionFirestore
    );
    return new Subscription({ ...subscription, ...overrides });
  }

  public toSegment(): Record<string, unknown> {
    return {
      from: `${this.from.name} <${this.from.email}>`,
      category: this.category,
    };
  }
}
