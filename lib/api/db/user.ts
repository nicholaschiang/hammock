import { DBNewsletter, DBSubscription } from 'lib/model/newsletter';
import { DBUser, DBViewUser, User } from 'lib/model/user';
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
  const newsletters = user.subscriptions.map((s) => s.toDB());
  logger.verbose(`Inserting ${newsletters.length} newsletter rows...`);
  const { error: err } = await supabase
    .from<DBNewsletter>('newsletters')
    .insert(newsletters);
  handle('creating', 'newsletters', newsletters, err);
  const subs = user.subscriptions.map((s) => ({
    newsletter: s.from.email,
    user: Number(u.id),
  }));
  logger.verbose(`Inserting ${subs.length} user subscription rows...`);
  const { error: e } = await supabase
    .from<DBSubscription>('subscriptions')
    .insert(subs);
  handle('creating', 'user subscriptions', subs, e);
  return new User({ ...u, subscriptions: user.subscriptions });
}

export async function updateUser(user: User): Promise<User> {
  logger.verbose(`Updating user (${user.toString()}) row...`);
  const { data, error } = await supabase
    .from<DBUser>('users')
    .upsert(user.toDB())
    .eq('id', user.id);
  handle('updating', 'user', user, error);
  const u = data ? User.fromDB(data[0]) : user;
  const newsletters = user.subscriptions.map((s) => s.toDB());
  logger.verbose(`Upserting ${newsletters.length} newsletter rows...`);
  const { error: err } = await supabase
    .from<DBNewsletter>('newsletters')
    .upsert(newsletters);
  handle('upserting', 'newsletters', newsletters, err);
  const subs = user.subscriptions.map((s) => ({
    newsletter: s.from.email,
    user: Number(u.id),
  }));
  logger.verbose(`Upserting ${subs.length} user subscription rows...`);
  const { error: e } = await supabase
    .from<DBSubscription>('subscriptions')
    .upsert(subs, { onConflict: 'newsletter,user' });
  handle('upserting', 'user subscriptions', subs, e);
  return new User({ ...u, subscriptions: user.subscriptions });
}

export async function getUser(id: string): Promise<User> {
  logger.verbose(`Selecting user (${id}) row...`);
  const { data, error } = await supabase
    .from<DBViewUser>('view_users')
    .select()
    .eq('id', Number(id));
  handle('getting', 'user', id, error);
  if (!data?.length) throw new APIError(`User (${id}) does not exist`, 404);
  return User.fromDB(data[0]);
}

export async function getUsers(): Promise<User[]> {
  logger.verbose(`Selecting all user rows...`);
  const { data, error } = await supabase
    .from<DBViewUser>('view_users')
    .select();
  handle('getting', 'users', '', error);
  return (data || []).map((d) => User.fromDB(d));
}
