import {
  Subscription,
  SubscriptionJSON,
  isSubscriptionJSON,
} from 'lib/model/subscription';
import { isArray, isJSON } from 'lib/model/json';
import { APIError } from 'lib/model/error';
import { caps } from 'lib/utils';
import clone from 'lib/utils/clone';
import construct from 'lib/model/construct';
import definedVals from 'lib/model/defined-vals';

export const SCOPES = {
  EMAIL: 'https://www.googleapis.com/auth/userinfo.email',
  PROFILE: 'https://www.googleapis.com/auth/userinfo.profile',
  READ: 'https://www.googleapis.com/auth/gmail.readonly',
  LABEL: 'https://www.googleapis.com/auth/gmail.labels',
  FILTER: 'https://www.googleapis.com/auth/gmail.settings.basic',
};

/**
 * @typedef {Object} UserInterface
 * @property id - The user's Google OAuth2 provided unique identifier.
 * @property name - The user's name.
 * @property photo - The user's avatar photo URL.
 * @property locale - The user's locale code (returned by Google OAuth2).
 * @property email - The user's email address.
 * @property phone - The user's phone number.
 * @property token - The user's OAuth2 token that we use to access Gmail's API.
 * @property scopes - An array of the user's granted OAuth2 scopes. This helps
 * us determine what features to enable (e.g. if the user has granted only
 * `gmail.readonly` access, we can't create the "Hammock" label or filter).
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
  scopes: string[];
  label: string;
  filter: string;
  subscriptions: Subscription[];
}

export interface DBUser {
  id: number;
  name: string;
  photo: string | null;
  email: string | null;
  phone: string | null;
  locale: string;
  token: string;
  scopes: string[];
  label: string;
  filter: string;
}

export type UserJSON = Omit<UserInterface, 'subscriptions'> & {
  subscriptions: SubscriptionJSON[];
};

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

  if (!isJSON(json)) throw new APIError('Expected valid JSON body', 400);
  if (stringFields.some((key) => typeof json[key] !== 'string'))
    throw new APIError('Expected valid string field', 400);
  if (!isArray(json.subscriptions, isSubscriptionJSON))
    throw new APIError('Expected valid subscriptions', 400);
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

  public scopes: string[] = [];

  public label = '';

  public filter = '';

  public subscriptions: Subscription[] = [];

  public constructor(user: Partial<UserInterface> = {}) {
    construct<UserInterface>(this, user);
  }

  public get subscriptionEmails(): string[] {
    return this.subscriptions.map((s) => s.from.email);
  }

  public hasSubscription(sub: Subscription): boolean {
    return this.subscriptionEmails.includes(sub.from.email);
  }

  public addSubscription(sub: Subscription): void {
    if (!this.hasSubscription(sub)) this.subscriptions.push(sub);
  }

  public deleteSubscription(sub: Subscription): void {
    const idx = this.subscriptionEmails.indexOf(sub.from.email);
    if (idx >= 0) this.subscriptions.splice(idx, 1);
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
    return new User({
      ...json,
      subscriptions: json.subscriptions.map(Subscription.fromJSON),
    });
  }

  public toDB(): DBUser {
    return {
      id: Number(this.id),
      name: this.name,
      photo: this.photo || null,
      email: this.email || null,
      phone: this.phone || null,
      locale: this.locale,
      token: this.token,
      scopes: this.scopes,
      label: this.label,
      filter: this.filter,
      subscriptions: this.subscriptions.map((s) => s.toDB()),
    };
  }

  public static fromDB(record: DBUser): User {
    return new User({
      id: record.id.toString(),
      name: record.name,
      photo: record.photo || '',
      email: record.email || '',
      phone: record.phone || '',
      locale: record.locale,
      token: record.token,
      scopes: record.scopes,
      label: record.label,
      filter: record.filter,
      subscriptions: record.subscriptions.map((s) => Subscription.fromDB(s)),
    });
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
