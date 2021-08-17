import { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import { withSentry } from '@sentry/nextjs';

import { APIErrorJSON } from 'lib/model/error';
import { DBHighlight } from 'lib/model/highlight';
import { handle } from 'lib/api/error';
import handleSupabaseError from 'lib/api/db/error';
import logger from 'lib/api/logger';
import segment from 'lib/api/segment';
import supabase from 'lib/api/supabase';
import verifyAuth from 'lib/api/verify/auth';
import verifyQueryId from 'lib/api/verify/query-id';

async function highlightAPI(
  req: Req,
  res: Res<void | APIErrorJSON>
): Promise<void> {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    res.status(405).end(`Method ${req.method as string} Not Allowed`);
  } else {
    try {
      const id = verifyQueryId(req.query);
      const user = await verifyAuth(req);
      logger.verbose(`Deleting highlight (${id}) for ${user}...`);
      const { error } = await supabase
        .from<DBHighlight>('highlights')
        .delete()
        .eq('user', Number(user.id))
        .eq('id', id);
      handleSupabaseError('deleting', 'highlight', id, error);
      res.status(204).end();
      logger.info(`Deleted highlight (${id}) for ${user}.`);
      segment.track({ userId: user.id, event: 'Highlight Deleted' });
    } catch (e) {
      handle(e, res);
    }
  }
}

export default withSentry(highlightAPI);
