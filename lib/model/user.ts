import { Subscription, SubscriptionFirestore, SubscriptionJSON, isSubscriptionJSON } from 'lib/model/subscription';
import { isJSON, isArray } from 'lib/model/json';
import { DocumentSnapshot } from 'lib/api/firebase';
import { caps } from 'lib/utils';
import clone from 'lib/utils/clone';
import construct from 'lib/model/construct';
import definedVals from 'lib/model/defined-vals';

/**
 * @typedef {Object} UserInterface
 * @property id - The user's Firebase Authentication ID.
 * @property name - The user's name.
 * @property photo - The user's avatar photo URL.
 * @property locale - The user's locale code (returned by Google OAuth2).
 * @property email - The user's email address.
 * @property phone - The user's phone number.
 * @property token - The user's OAuth token that we use to access Gmail's API.
 * @property label - The Gmail label ID for the "Hammock" label
 * that we create when the user is onboarded.
 * @property filter - The Gmail filter ID that we create when the user signs up.
 * @property subscriptions - An array of newsletter email addresses that the
 * user has subscribed to (i.e. the newsletters that show up in their feed).
 */
export interface UserInterface {
  id: string;
  name: string;
  photo: string;
  locale: string;
  email: string;
  phone: string;
  token: string;
  label: string;
  filter: string;
  subscriptions: Subscription[];
}

export type UserJSON = Omit<UserInterface, 'subscriptions'> & { subscriptions: SubscriptionJSON[] };
export type UserFirestore = Omit<UserInterface, 'subscriptions'> & { subscriptions: SubscriptionFirestore[] };

export function isUserJSON(json: unknown): json is UserJSON {
  const stringFields = [
    'id',
    'name',
    'photo',
    'locale',
    'email',
    'phone',
    'token',
    'label',
    'filter',
  ];

  if (!isJSON(json)) return false;
  if (stringFields.some((key) => typeof json[key] !== 'string')) return false;
  if (!isArray(json.subscriptions, isSubscriptionJSON)) return false; 
  return true;
}

export class User implements UserInterface {
  public id = '';

  public name = '';

  public photo = '';

  public locale = '';

  public email = '';

  public phone = '';

  public token = '';

  public label = '';

  public filter = '';

  public subscriptions: Subscription[] = [];

  public constructor(user: Partial<UserInterface> = {}) {
    construct<UserInterface>(this, user);
  }

  public get firstName(): string {
    return caps(this.name.split(' ')[0] || '');
  }

  public get lastName(): string {
    const parts: string[] = this.name.split(' ');
    return caps(parts[parts.length - 1] || '');
  }

  public get clone(): User {
    return new User(clone(this));
  }

  public toJSON(): UserJSON {
    return definedVals(this);
  }

  public static fromJSON(json: UserJSON): User {
    return new User({ ...json, subscriptions: json.subscriptions.map(Subscription.fromJSON) });
  }

  public toFirestore(): UserFirestore {
    return definedVals(this);
  }

  public static fromFirestore(data: UserFirestore): User {
    return new User({ ...data, subscriptions: data.subscriptions.map(Subscription.fromFirestore) });
  }

  public static fromFirestoreDoc(snapshot: DocumentSnapshot): User {
    if (!snapshot.exists) return new User();
    const overrides = definedVals({ id: snapshot.id });
    const user = User.fromFirestore(snapshot.data() as UserFirestore);
    return new User({ ...user, ...overrides });
  }

  public toString(): string {
    return `${this.name}${this.id ? ` (${this.id})` : ''}`;
  }

  public toSegment(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      phone: this.phone,
      avatar: this.photo,
    };
  }
}
