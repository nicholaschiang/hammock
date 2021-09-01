import { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import { withSentry } from '@sentry/nextjs';

import { APIError, APIErrorJSON } from 'lib/model/error';
import { Note, isNote } from 'lib/model/note';
import { handle } from 'lib/api/error';
import handleSupabaseError from 'lib/api/db/error';
import logger from 'lib/api/logger';
import segment from 'lib/api/segment';
import supabase from 'lib/api/supabase';
import verifyAuth from 'lib/api/verify/auth';
import verifyBody from 'lib/api/verify/body';
import verifyQueryId from 'lib/api/verify/query-id';

async function fetchNotes(
  req: Req,
  res: Res<Note[] | APIErrorJSON>
): Promise<void> {
  try {
    console.time('get-notes-api');
    const id = verifyQueryId(req.query);
    const user = await verifyAuth(req);
    logger.verbose(`Fetching (${id}) notes for ${user}...`);
    const { data, error } = await supabase
      .from<Note>('notes')
      .select()
      .eq('user', Number(user.id))
      .eq('message', id)
      .order('id');
    handleSupabaseError('selecting', 'notes', user.id, error);
    res.status(200).json(data || []);
    logger.info(`Fetched ${data?.length} (${id}) notes for ${user}.`);
    console.timeEnd('get-notes-api');
    segment.track({ userId: user.id, event: 'Notes Listed' });
  } catch (e) {
    handle(e, res);
  }
}

async function createNote(
  req: Req,
  res: Res<Note | APIErrorJSON>
): Promise<void> {
  try {
    console.time('create-note-api');
    const body = verifyBody<Note>(req.body, isNote);
    const user = await verifyAuth(req);
    if (Number(user.id) !== body.user)
      throw new APIError('You can only create notes for yourself', 403);
    const { data, error } = await supabase
      .from<Note>('notes')
      .insert({ ...body, id: undefined });
    handleSupabaseError('creating', 'note', body, error);
    res.status(201).json(data ? data[0] : body);
    logger.info(`Created note (${data ? data[0].id : ''}) for ${user}.`);
    console.timeEnd('create-note-api');
    segment.track({
      userId: user.id,
      event: 'Note Created',
      properties: data ? data[0] : body,
    });
  } catch (e) {
    handle(e, res);
  }
}

async function notesAPI(
  req: Req,
  res: Res<Note[] | Note | APIErrorJSON>
): Promise<void> {
  switch (req.method) {
    case 'GET':
      await fetchNotes(req, res);
      break;
    case 'POST':
      await createNote(req, res);
      break;
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method as string} Not Allowed`);
  }
}

export default withSentry(notesAPI);
