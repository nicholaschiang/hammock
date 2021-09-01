import { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import { withSentry } from '@sentry/nextjs';

import { APIError, APIErrorJSON } from 'lib/model/error';
import { Highlight, isHighlight } from 'lib/model/highlight';
import { handle } from 'lib/api/error';
import handleSupabaseError from 'lib/api/db/error';
import logger from 'lib/api/logger';
import segment from 'lib/api/segment';
import supabase from 'lib/api/supabase';
import verifyAuth from 'lib/api/verify/auth';
import verifyBody from 'lib/api/verify/body';
import verifyQueryId from 'lib/api/verify/query-id';

async function fetchHighlights(
  req: Req,
  res: Res<Highlight[] | APIErrorJSON>
): Promise<void> {
  try {
    console.time('get-highlights-api');
    const id = verifyQueryId(req.query);
    const user = await verifyAuth(req);
    const usr = `${user.name} (${user.id})`;
    logger.verbose(`Fetching (${id}) highlights for ${usr}...`);
    const { data, error } = await supabase
      .from<Highlight>('highlights')
      .select()
      .eq('user', Number(user.id))
      .eq('message', id)
      .order('id');
    handleSupabaseError('selecting', 'highlights', user.id, error);
    res.status(200).json(data || []);
    logger.info(`Fetched ${data?.length} (${id}) highlights for ${usr}.`);
    console.timeEnd('get-highlights-api');
    segment.track({ userId: user.id, event: 'Highlights Listed' });
  } catch (e) {
    handle(e, res);
  }
}

async function createHighlight(
  req: Req,
  res: Res<Highlight | APIErrorJSON>
): Promise<void> {
  try {
    console.time('create-highlight-api');
    const body = verifyBody<Highlight>(req.body, isHighlight);
    const user = await verifyAuth(req);
    const usr = `${user.name} (${user.id})`;
    if (Number(user.id) !== body.user)
      throw new APIError('You can only create highlights for yourself', 403);
    const { data, error } = await supabase
      .from<Highlight>('highlights')
      .insert({ ...body, id: undefined });
    handleSupabaseError('creating', 'highlight', body, error);
    res.status(201).json(data ? data[0] : body);
    logger.info(`Created highlight (${data ? data[0].id : ''}) for ${usr}.`);
    console.timeEnd('create-highlight-api');
    segment.track({
      userId: user.id,
      event: 'Highlight Created',
      properties: data ? data[0] : body,
    });
  } catch (e) {
    handle(e, res);
  }
}

async function highlightsAPI(
  req: Req,
  res: Res<Highlight[] | Highlight | APIErrorJSON>
): Promise<void> {
  switch (req.method) {
    case 'GET':
      await fetchHighlights(req, res);
      break;
    case 'POST':
      await createHighlight(req, res);
      break;
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method as string} Not Allowed`);
  }
}

export default withSentry(highlightsAPI);
