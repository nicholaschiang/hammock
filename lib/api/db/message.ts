import { APIError } from 'lib/model/error';
import { Message } from 'lib/model/message';
import handle from 'lib/api/db/error';
import logger from 'lib/api/logger';
import supabase from 'lib/api/supabase';

export async function createMessage(message: Message): Promise<Message> {
  logger.verbose(`Inserting message (${message}) row...`);
  const { data, error } = await supabase
    .from<Message>('messages')
    .insert(message);
  handle('inserting', 'message row', message, error);
  return data ? data[0] : message;
}

export async function updateMessage(message: Message): Promise<Message> {
  logger.verbose(`Updating message (${message}) row...`);
  const { data, error } = await supabase
    .from<Message>('messages')
    .update(message)
    .eq('id', message.id);
  handle('updating', 'message row', message, error);
  return data ? data[0] : message;
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
