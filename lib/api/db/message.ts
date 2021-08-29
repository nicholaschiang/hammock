import { APIError } from 'lib/model/error';
import { Message } from 'lib/model/message';
import { User } from 'lib/model/user';
import handle from 'lib/api/db/error';
import logger from 'lib/api/logger';
import supabase from 'lib/api/supabase';

export async function createMessage(message: Message): Promise<Message> {
  logger.verbose(`Inserting message (${message.id}) row...`);
  const { data, error } = await supabase
    .from<Message>('messages')
    .insert(message);
  handle('inserting', 'message row', message, error);
  return data ? data[0] : message;
}

export async function updateMessage(message: Message): Promise<Message> {
  logger.verbose(`Updating message (${message.id}) row...`);
  const { data, error } = await supabase
    .from<Message>('messages')
    .update(message)
    .eq('id', message.id);
  handle('updating', 'message row', message, error);
  return data ? data[0] : message;
}

export async function deleteMessage(id: string): Promise<void> {
  logger.verbose(`Deleting message (${id}) row...`);
  const { error } = await supabase
    .from<Message>('messages')
    .delete()
    .eq('id', id);
  handle('deleting', 'message row', id, error);
}

// Deletes messages that are in our database that are no longer subscribed to.
export async function removeMessages(user: User): Promise<void> {
  logger.verbose(`Removing messages for ${user.name} (${user.id})...`);
  const { error } = await supabase
    .from<Message>('messages')
    .delete()
    .eq('user', user.id)
    .not(
      'email',
      'in',
      user.subscriptions.map((s) => s.email)
    );
  handle(
    'removing',
    'messages',
    user.subscriptions.map((s) => s.email),
    error
  );
}

export async function getMessage(id: string): Promise<Message> {
  logger.verbose(`Selecting message (${id}) row...`);
  const { data, error } = await supabase
    .from<Message>('messages')
    .select()
    .eq('id', id);
  handle('selecting', 'message row', id, error);
  if (!data?.length) throw new APIError(`Message (${id}) does not exist`, 404);
  return data[0];
}
