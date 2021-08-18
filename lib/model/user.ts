import { Subscription, isSubscription } from 'lib/model/subscription';
import { isArray, isJSON } from 'lib/model/json';
import { APIError } from 'lib/model/error';

export const SCOPES = {
  EMAIL: 'https://www.googleapis.com/auth/userinfo.email',
  PROFILE: 'https://www.googleapis.com/auth/userinfo.profile',
  READ: 'https://www.googleapis.com/auth/gmail.readonly',
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
  if (!isJSON(user)) throw new APIError('Expected valid JSON body', 400);
  if (stringFields.some((key) => typeof user[key] !== 'string'))
    throw new APIError('Expected valid string field', 400);
  if (!isArray(user.subscriptions, isSubscription))
    throw new APIError('Expected valid subscriptions', 400);
  return true;
}
