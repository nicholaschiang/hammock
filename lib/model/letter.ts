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
 * @typedef {Object} LetterInterface
 * @extends ResourceInterface
 * @property from - Who the newsletter is from (their name, email, and photo).
 * @property [category] - Either "important" (a known newsletter listed on our
 * whitelist or with a whitelisted sender domain) or "other" (any email that
 * contains the `list-unsubscribe` header) or missing (not a newsletter).
 */
export interface LetterInterface extends ResourceInterface {
  from: Contact;
  category?: Category;
}

export type LetterJSON = Omit<LetterInterface, keyof Resource> & ResourceJSON;
export type LetterFirestore = Omit<LetterInterface, keyof Resource> &
  ResourceFirestore;

export function isLetterJSON(json: unknown): json is LetterJSON {
  if (!isResourceJSON(json)) return false;
  if (!isJSON(json)) return false;
  if (!isContact(json.from)) return false;
  if (!isCategory(json.category)) return false;
  return true;
}

export class Letter extends Resource implements LetterInterface {
  public from = { name: '', email: '', photo: '' };

  public category?: Category;

  public constructor(letter: Partial<LetterInterface> = {}) {
    super(letter);
    construct<LetterInterface, ResourceInterface>(this, letter, new Resource());
  }

  public get clone(): Letter {
    return new Letter(clone(this));
  }

  public toString(): string {
    return `Letter from ${this.from.name} (${this.from.email})`;
  }

  public toJSON(): LetterJSON {
    return definedVals({ ...this, ...super.toJSON() });
  }

  public static fromJSON(json: LetterJSON): Letter {
    return new Letter({ ...json, ...Resource.fromJSON(json) });
  }

  public toFirestore(): LetterFirestore {
    return definedVals({ ...this, ...super.toFirestore() });
  }

  public static fromFirestore(data: LetterFirestore): Letter {
    return new Letter({ ...data, ...Resource.fromFirestore(data) });
  }

  public static fromFirestoreDoc(snapshot: DocumentSnapshot): Letter {
    if (!snapshot.exists) return new Letter();
    const overrides = definedVals({
      created: snapshot.createTime?.toDate(),
      updated: snapshot.updateTime?.toDate(),
      id: snapshot.id,
    });
    const letter = Letter.fromFirestore(snapshot.data() as LetterFirestore);
    return new Letter({ ...letter, ...overrides });
  }
}
