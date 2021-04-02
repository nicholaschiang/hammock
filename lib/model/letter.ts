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

import { whitelist } from 'lib/whitelist';

export type Category = 'important' | 'other';

export function isCategory(category: unknown): category is Category {
  if (typeof category !== 'string') return false;
  return ['important', 'other'].includes(category);
}

export interface LetterInterface extends ResourceInterface {
  name: string;
  from: string;
  category: Category;
}

export type LetterJSON = Omit<LetterInterface, keyof Resource> & ResourceJSON;
export type LetterFirestore = Omit<LetterInterface, keyof Resource> &
  ResourceFirestore;

export function isLetterJSON(json: unknown): json is LetterJSON {
  if (!isResourceJSON(json)) return false;
  if (!isJSON(json)) return false;
  if (typeof json.name !== 'string') return false;
  if (typeof json.from !== 'string') return false;
  if (!isCategory(json.category)) return false;
  return true;
}

export class Letter extends Resource implements LetterInterface {
  public name: string = '';

  public from: string = '';

  public category: Category = 'other';

  public constructor(letter: Partial<LetterInterface> = {}) {
    super(letter);
    construct<LetterInterface, ResourceInterface>(this, letter, new Resource());
  }

  public get icon(): string {
    const result = whitelist[this.name.toLowerCase()];
    if (result && result !== true && result.asset_url) return result.asset_url;
    let domain = this.from.slice(this.from.indexOf('@') + 1);
    if (domain.startsWith('e.')) {
      domain = domain.slice(2);
    }
    if (domain.startsWith('email.')) {
      domain = domain.slice(6);
    }
    if (domain.startsWith('mail.')) {
      domain = domain.slice(5);
    }
    return 'https://www.google.com/s2/favicons?sz=64&domain_url=' + domain;
  }

  public get clone(): Letter {
    return new Letter(clone(this));
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
