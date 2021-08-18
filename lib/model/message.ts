import { isDateJSON, isJSON } from 'lib/model/json';
import { APIError } from 'lib/model/error';
import { Category } from 'lib/model/subscription';

// Format of Gmail message requested from Google's API.
// @see {@link https://developers.google.com/gmail/api/reference/rest/v1/Format}
export type Format = 'MINIMAL' | 'FULL' | 'RAW' | 'METADATA';

export interface Message {
  user: number;
  id: string;
  name: string;
  email: string;
  photo: string;
  category: Category;
  favorite: boolean;
  date: string;
  subject: string;
  snippet: string;
  raw: string;
  html: string;
  archived: boolean;
  scroll: number;
  time: number;
}

export function isMessage(message: unknown): message is Message {
  const stringFields = ['id', 'subject', 'snippet', 'raw', 'html'];
  const numberFields = ['scroll', 'time'];

  if (!isJSON(message)) throw new APIError('Expected valid JSON body', 400);
  if (!isDateJSON(message.date))
    throw new APIError('Expected valid "date" JSON field', 400);
  if (stringFields.some((key) => typeof message[key] !== 'string'))
    throw new APIError('Expected valid string JSON fields', 400);
  if (numberFields.some((key) => typeof message[key] !== 'number'))
    throw new APIError('Expected valid number JSON fields', 400);
  if (typeof message.archived !== 'boolean')
    throw new APIError('Expected "archived" field of type boolean', 400);
  return true;
}
