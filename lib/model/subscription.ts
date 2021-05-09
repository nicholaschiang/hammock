import {
  Resource,
  ResourceFirestore,
  ResourceInterface,
  ResourceJSON,
  isResourceJSON,
} from 'lib/model/resource';
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
 * @extends ResourceInterface
 * @property from - Who the newsletter is from (their name, email, and photo).
 * @property [category] - Either "important" (a known newsletter listed on our
 * whitelist or with a whitelisted sender domain) or "other" (any email that
 * contains the `list-unsubscribe` header) or missing (not a newsletter).
 */
export interface SubscriptionInterface extends ResourceInterface {
  from: Contact;
  category?: Category;
}

export type SubscriptionJSON = Omit<SubscriptionInterface, keyof Resource> &
  ResourceJSON;
export type SubscriptionFirestore = Omit<
  SubscriptionInterface,
  keyof Resource
> &
  ResourceFirestore;

export function isSubscriptionJSON(json: unknown): json is SubscriptionJSON {
  if (!isResourceJSON(json)) return false;
  if (!isJSON(json)) return false;
  if (!isContact(json.from)) return false;
  if (!isCategory(json.category)) return false;
  return true;
}

export class Subscription extends Resource implements SubscriptionInterface {
  public from = { name: '', email: '', photo: '' };

  public category?: Category;

  public constructor(subscription: Partial<SubscriptionInterface> = {}) {
    super(subscription);
    construct<SubscriptionInterface, ResourceInterface>(
      this,
      subscription,
      new Resource()
    );
  }

  public get clone(): Subscription {
    return new Subscription(clone(this));
  }

  public toString(): string {
    return `Subscription from ${this.from.name} (${this.from.email})`;
  }

  public toJSON(): SubscriptionJSON {
    return definedVals({ ...this, ...super.toJSON() });
  }

  public static fromJSON(json: SubscriptionJSON): Subscription {
    return new Subscription({ ...json, ...Resource.fromJSON(json) });
  }

  public toFirestore(): SubscriptionFirestore {
    return definedVals({ ...this, ...super.toFirestore() });
  }

  public static fromFirestore(data: SubscriptionFirestore): Subscription {
    return new Subscription({ ...data, ...Resource.fromFirestore(data) });
  }

  public static fromFirestoreDoc(snapshot: DocumentSnapshot): Subscription {
    if (!snapshot.exists) return new Subscription();
    const overrides = definedVals({
      created: snapshot.createTime?.toDate(),
      updated: snapshot.updateTime?.toDate(),
      id: snapshot.id,
    });
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
