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
  if (!isJSON(message)) throw new APIError('Expected valid JSON body', 400);
  if (!isDateJSON(message.date))
    throw new APIError('Expected ISO date string "date" field', 400);
  ['id', 'subject', 'snippet', 'raw', 'html'].forEach((key) => {
    if (typeof message[key] !== 'string')
      throw new APIError(`Expected string "${key}" field`, 400);
  });
  ['scroll', 'time'].forEach((key) => {
    if (typeof message[key] !== 'number')
      throw new APIError(`Expected number "${key}" field`, 400);
  });
  if (typeof message.archived !== 'boolean')
    throw new APIError('Expected boolean "archived" field', 400);
  return true;
}
