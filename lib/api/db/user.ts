import { DBUser, User } from 'lib/model/user';
import { DBSubscription } from 'lib/model/newsletter';
import { APIError } from 'lib/model/error';
import handle from 'lib/api/db/error';
import logger from 'lib/api/logger';
import supabase from 'lib/api/supabase';

export async function createUser(user: User): Promise<User> {
  logger.verbose(`Inserting user (${user.toString()}) row...`);
  const { data, error } = await supabase
    .from<DBUser>('users')
    .insert(user.toDB());
  handle('creating', 'user', user, error);
  const u = data ? User.fromDB(data[0]) : user;
  const subs = user.subscriptions.map((s) => ({
    newsletter: s.from.email,
    user: Number(u.id),
  }));
  logger.verbose(`Inserting ${subs.length} user subscription rows...`);
  const { error: err } = await supabase
    .from<DBSubscription>('subscriptions')
    .insert(subs);
  handle('creating', 'user subscriptions', subs, err);
  return new User({ ...u, subscriptions: user.subscriptions });
}

export async function updateUser(user: User): Promise<User> {
  logger.verbose(`Updating user (${user.toString()}) row...`);
  const { data, error } = await supabase
    .from<DBUser>('users')
    .update(user.toDB())
    .eq('id', user.id);
  handle('updating', 'user', user, error);
  const u = data ? User.fromDB(data[0]) : user;
  const subs = user.subscriptions.map((s) => ({
    newsletter: s.from.email,
    user: Number(u.id),
  }));
  logger.verbose(`Upserting ${subs.length} user subscription rows...`);
  const { error: err } = await supabase
    .from<DBSubscription>('subscriptions')
    .upsert(subs, { onConflict: 'newsletter,user' });
  handle('upserting', 'user subscriptions', subs, err);
  return new User({ ...u, subscriptions: user.subscriptions });
}

export async function getUser(id: string): Promise<User> {
  logger.verbose(`Selecting user (${id}) row...`);
  const { data, error } = await supabase
    .from<DBUser>('users')
    .select()
    .eq('id', id);
  handle('getting', 'user', id, error);
  if (!data?.length) throw new APIError(`User (${id}) does not exist`, 404);
  return User.fromDB(data[0]);
}
