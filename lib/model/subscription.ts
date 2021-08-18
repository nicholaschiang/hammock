import { APIError } from 'lib/model/error';
import { isJSON } from 'lib/model/json';

export type Category = 'important' | 'other';

export function isCategory(category: unknown): category is Category {
  if (typeof category !== 'string') return false;
  return ['important', 'other'].includes(category);
}

export interface Subscription {
  name: string;
  email: string;
  photo: string;
  category: Category;
  favorite: boolean;
}

export function isSubscription(sub: unknown): sub is Subscription {
  if (!isJSON(sub)) throw new APIError('Expected valid JSON body', 400);
  if (!isCategory(sub.category))
    throw new APIError('Expected category of "important" or "other"', 400);
  if (typeof sub.favorite !== 'boolean')
    throw new APIError('Expected favorite of type boolean', 400);
  return true;
}
