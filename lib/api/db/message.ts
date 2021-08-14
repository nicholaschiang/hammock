import { DBHighlight, DBMessage, Message } from 'lib/model/message';
import { APIError } from 'lib/model/error';
import handle from 'lib/api/db/error';
import logger from 'lib/api/logger';
import supabase from 'lib/api/supabase';

export async function createMessage(message: Message): Promise<Message> {
  logger.verbose(`Inserting message (${message.toString()}) row...`);
  const { data, error } = await supabase
    .from<DBMessage>('messages')
    .insert(message.toDB());
  handle('creating', 'message', message, error);
  const m = data ? Message.fromDB(data[0]) : message;
  const h = m.highlights.map((a) => ({ ...a, message: m.id, id: undefined }));
  logger.verbose(`Inserting ${h.length} message highlight rows...`);
  const { error: err } = await supabase
    .from<DBHighlight>('highlights')
    .insert(h);
  handle('creating', 'message highlights', h, err);
  return new Message({ ...m, highlights: message.highlights });
}

export async function updateMessage(message: Message): Promise<Message> {
  logger.verbose(`Updating message (${message.toString()}) row...`);
  const { data, error } = await supabase
    .from<DBMessage>('messages')
    .update(message.toDB())
    .eq('id', message.id);
  handle('updating', 'message', message, error);
  const m = data ? Message.fromDB(data[0]) : message;
  await Promise.all(
    m.highlights.map(async (highlight) => {
      logger.verbose(`Updating message highlight (${highlight.id}) row...`);
      const { error: err } = await supabase
        .from<DBHighlight>('highlights')
        .update({ ...highlight, message: m.id, id: undefined })
        .eq('id', highlight.id);
      handle('updating', 'message highlight', highlight, err);
    })
  );
  return new Message({ ...m, highlights: message.highlights });
}

export async function getMessage(id: string): Promise<Message> {
  logger.verbose(`Selecting message (${id}) row...`);
  const { data, error } = await supabase
    .from<DBMessage>('messages')
    .select()
    .eq('id', id);
  handle('getting', 'message', id, error);
  if (!data?.length) throw new APIError(`Message (${id}) does not exist`, 404);
  return Message.fromDB(data[0]);
}
