import {
  Resource,
  ResourceFirestore,
  ResourceInterface,
  ResourceJSON,
  isResourceJSON,
} from 'lib/model/resource';
import { Letter } from 'lib/model/letter';
import { DocumentSnapshot } from 'lib/api/firebase';
import clone from 'lib/utils/clone';
import construct from 'lib/model/construct';
import definedVals from 'lib/model/defined-vals';
import { isJSON } from 'lib/model/json';

import { whitelist, hasWhitelistDomain } from 'lib/whitelist';
import { parseFrom } from 'lib/utils';

interface Part {
  mimeType: string;
  body: { data: string };
  parts: Part[] | null;
}

interface Header {
  name: string;
  value: string;
}

interface Payload {
  mimeType: string;
  body: { data: string };
  headers: Header[];
  parts: Part[];
}

export interface MessageInterface extends ResourceInterface {
  id: string;
  labelIds: string[];
  snippet: string;
  internalDate: string;
  payload: Payload;
}

export type MessageJSON = Omit<MessageInterface, keyof Resource> & ResourceJSON;
export type MessageFirestore = Omit<MessageInterface, keyof Resource> &
  ResourceFirestore;

// TODO: Actually implement this (we should reformat the default Gmail data
// format before we do though... we don't need all of that data).
export function isMessageJSON(json: unknown): json is MessageJSON {
  if (!isResourceJSON(json)) return false;
  if (!isJSON(json)) return false;
  return true;
}

export class Message extends Resource implements MessageInterface {
  public id: string = '';

  public labelIds: string[] = [];

  public snippet: string = '';

  public internalDate: string = '';

  public payload: Payload = {
    mimeType: '',
    body: { data: '' },
    headers: [],
    parts: [],
  };

  public constructor(letter: Partial<MessageInterface> = {}) {
    super(letter);
    construct<MessageInterface, ResourceInterface>(
      this,
      letter,
      new Resource()
    );
  }

  public getHeader(header: string): string | undefined {
    return this.payload.headers.find((h) => h.name.toLowerCase() === header)
      ?.value;
  }

  public get letter(): Letter | undefined {
    const from = this.getHeader('from');
    const { name, email } = parseFrom(from as string);
    if (whitelist[name.toLowerCase()] || hasWhitelistDomain(email))
      return new Letter({
        name,
        from: email,
        selected: true,
        category: 'important',
      });
    if (!this.getHeader('list-unsubscribe')) return;
    return new Letter({
      name,
      from: email,
      selected: false,
      category: 'other',
    });
  }

  public get icon(): string {
    const from = this.getHeader('from');
    const { name, email } = parseFrom(from as string);
    const result = whitelist[name.toLowerCase()];
    if (result && result !== true && result.asset_url) return result.asset_url;
    let domain = email.slice(email.indexOf('@') + 1);
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

  public get clone(): Message {
    return new Message(clone(this));
  }

  public toJSON(): MessageJSON {
    return definedVals({ ...this, ...super.toJSON() });
  }

  public static fromJSON(json: MessageJSON): Message {
    return new Message({ ...json, ...Resource.fromJSON(json) });
  }

  public toFirestore(): MessageFirestore {
    return definedVals({ ...this, ...super.toFirestore() });
  }

  public static fromFirestore(data: MessageFirestore): Message {
    return new Message({ ...data, ...Resource.fromFirestore(data) });
  }

  public static fromFirestoreDoc(snapshot: DocumentSnapshot): Message {
    if (!snapshot.exists) return new Message();
    const overrides = definedVals({
      created: snapshot.createTime?.toDate(),
      updated: snapshot.updateTime?.toDate(),
      id: snapshot.id,
    });
    const letter = Message.fromFirestore(snapshot.data() as MessageFirestore);
    return new Message({ ...letter, ...overrides });
  }
}