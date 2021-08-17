import { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import { withSentry } from '@sentry/nextjs';

import { APIErrorJSON } from 'lib/model/error';
import { DBHighlight } from 'lib/model/highlight';
import { DBMessage } from 'lib/model/message';
import { handle } from 'lib/api/error';
import handleSupabaseError from 'lib/api/db/error';
import logger from 'lib/api/logger';
import segment from 'lib/api/segment';
import supabase from 'lib/api/supabase';
import verifyAuth from 'lib/api/verify/auth';

export const HITS_PER_PAGE = 10;
export type HighlightsQuery = { page?: string };
export type DBHighlightWithMessage = Omit<DBHighlight, 'message'> & {
  message: DBMessage;
};

async function highlightsAPI(
  req: Req,
  res: Res<DBHighlightWithMessage[] | APIErrorJSON>
): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method as string} Not Allowed`);
  } else {
    try {
      console.time('get-highlights-api');
      const { page } = req.query as HighlightsQuery;
      const pg = Number.isNaN(Number(page)) ? 0 : Number(page);
      const user = await verifyAuth(req);
      logger.verbose(`Fetching highlights for ${user}...`);
      const { data, error } = await supabase
        .from<DBHighlightWithMessage>('highlights')
        .select('*, message (*)')
        .eq('user', Number(user.id))
        .range(HITS_PER_PAGE * pg, HITS_PER_PAGE * (pg + 1) - 1);
      handleSupabaseError('selecting', 'highlights', user.id, error);
      res.status(200).json(data || []);
      logger.info(`Fetched ${data?.length} highlights for ${user}.`);
      console.timeEnd('get-highlights-api');
      segment.track({ userId: user.id, event: 'Highlights Listed' });
    } catch (e) {
      handle(e, res);
    }
  }
}

export default withSentry(highlightsAPI);
