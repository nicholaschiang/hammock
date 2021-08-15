import { DBUser, User } from 'lib/model/user';
import { APIError } from 'lib/model/error';
import handle from 'lib/api/db/error';
import logger from 'lib/api/logger';
import supabase from 'lib/api/supabase';

export async function createUser(user: User): Promise<User> {
  logger.verbose(`Inserting user (${user}) row...`);
  const { data, error } = await supabase
    .from<DBUser>('users')
    .insert(user.toDB());
  handle('inserting', 'user row', user, error);
  return data ? User.fromDB(data[0]) : user;
}

export async function updateUser(user: User): Promise<User> {
  logger.verbose(`Updating user (${user}) row...`);
  const { data, error } = await supabase
    .from<DBUser>('users')
    .update(user.toDB())
    .eq('id', Number(user.id));
  handle('updating', 'user row', user, error);
  return data ? User.fromDB(data[0]) : user;
}

export async function getUser(id: string): Promise<User> {
  logger.verbose(`Selecting user (${id}) row...`);
  const { data, error } = await supabase
    .from<DBUser>('users')
    .select()
    .eq('id', Number(id));
  handle('selecting', 'user row', id, error);
  if (!data?.length) throw new APIError(`User (${id}) does not exist`, 404);
  return User.fromDB(data[0]);
}
