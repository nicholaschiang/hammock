import { APIError } from 'lib/model/error';
import { User } from 'lib/model/user';
import handle from 'lib/api/db/error';
import logger from 'lib/api/logger';
import supabase from 'lib/api/supabase';

export async function createUser(user: User): Promise<User> {
  logger.debug(`Inserting user ${user.name} (${user.id}) row...`);
  const { data, error } = await supabase.from<User>('users').insert(user);
  handle('inserting', 'user row', user, error);
  return data ? data[0] : user;
}

export async function upsertUser(user: User): Promise<User> {
  logger.debug(`Upserting user ${user.name} (${user.id}) row...`);
  const { data, error } = await supabase
    .from<User>('users')
    .upsert(user, { onConflict: 'id' });
  handle('upserting', 'user row', user, error);
  return data ? data[0] : user;
}

export async function getUser(id: number): Promise<User> {
  logger.debug(`Selecting user (${id}) row...`);
  const { data, error } = await supabase
    .from<User>('users')
    .select()
    .eq('id', id);
  handle('selecting', 'user row', id, error);
  if (!data?.length) throw new APIError(`User (${id}) does not exist`, 404);
  return data[0];
}
