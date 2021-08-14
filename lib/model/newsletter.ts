import clone from 'lib/utils/clone';
import construct from 'lib/model/construct';
import definedVals from 'lib/model/defined-vals';
import { isJSON } from 'lib/model/json';

export interface Contact {
  name: string;
  photo: string;
  email: string;
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
 * @typedef {Object} NewsletterInterface
 * @property from - Who the newsletter is from (their name, email, and photo).
 * @property [category] - Either "important" (a known newsletter listed on our
 * whitelist or with a whitelisted sender domain) or "other" (any email that
 * contains the `list-unsubscribe` header) or missing (not a newsletter).
 * @property favorite - Whether or not this is a "favorite" newsletter.
 */
export interface NewsletterInterface {
  from: Contact;
  category?: Category;
  favorite: boolean;
}

export interface DBNewsletter {
  name: string;
  photo: string | null;
  email: string | null;
  category: Category | null;
  favorite: boolean;
}
export interface DBSubscription {
  newsletter: string;
  user: number;
}

export type NewsletterJSON = NewsletterInterface;

export function isNewsletterJSON(json: unknown): json is NewsletterJSON {
  if (!isJSON(json)) return false;
  if (!isContact(json.from)) return false;
  if (json.category && !isCategory(json.category)) return false;
  if (typeof json.favorite !== 'boolean') return false;
  return true;
}

export class Newsletter implements NewsletterInterface {
  public from = { name: '', email: '', photo: '' };

  public category?: Category;

  public favorite = false;

  public constructor(subscription: Partial<NewsletterInterface> = {}) {
    construct<NewsletterInterface>(this, subscription);
  }

  public get clone(): Newsletter {
    return new Newsletter(clone(this));
  }

  public toString(): string {
    return `Newsletter from ${this.from.name} (${this.from.email})`;
  }

  public toJSON(): NewsletterJSON {
    return definedVals(this);
  }

  public static fromJSON(json: NewsletterJSON): Newsletter {
    return new Newsletter(json);
  }

  public toSegment(): Record<string, unknown> {
    return {
      from: `${this.from.name} <${this.from.email}>`,
      category: this.category,
    };
  }
}
