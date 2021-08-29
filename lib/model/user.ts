import { Subscription, isSubscription } from 'lib/model/subscription';
import { isArray, isJSON, isStringArray } from 'lib/model/json';
import { APIError } from 'lib/model/error';

export const SCOPES = {
  EMAIL: 'https://www.googleapis.com/auth/userinfo.email',
  PROFILE: 'https://www.googleapis.com/auth/userinfo.profile',
  MODIFY: 'https://www.googleapis.com/auth/gmail.modify',
  LABEL: 'https://www.googleapis.com/auth/gmail.labels',
  FILTER: 'https://www.googleapis.com/auth/gmail.settings.basic',
};

export interface User {
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
  subscriptions: Subscription[];
}

export function isUser(user: unknown): user is User {
  if (!isJSON(user)) throw new APIError('Expected valid JSON body', 400);
  if (typeof user.id !== 'number')
    throw new APIError('Expected valid number ID field', 400);
  if (typeof user.name !== 'string')
    throw new APIError('Expected valid string name field', 400);
  if (typeof user.photo !== 'string' && user.photo !== null)
    throw new APIError('Expected valid string or null photo field', 400);
  if (typeof user.email !== 'string' && user.email !== null)
    throw new APIError('Expected valid string or null email field', 400);
  if (typeof user.phone !== 'string' && user.phone !== null)
    throw new APIError('Expected valid string or null phone field', 400);
  if (typeof user.locale !== 'string')
    throw new APIError('Expected valid string locale field', 400);
  if (typeof user.token !== 'string')
    throw new APIError('Expected valid string token field', 400);
  if (!isStringArray(user.scopes))
    throw new APIError('Expected valid subscriptions', 400);
  if (typeof user.label !== 'string')
    throw new APIError('Expected valid string label field', 400);
  if (typeof user.filter !== 'string')
    throw new APIError('Expected valid string filter field', 400);
  if (!isArray(user.subscriptions, isSubscription))
    throw new APIError('Expected valid subscriptions', 400);
  return true;
}
