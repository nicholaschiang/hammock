import { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import { withSentry } from '@sentry/nextjs';

import { APIError, APIErrorJSON } from 'lib/model/error';
import { Highlight } from 'lib/model/highlight';
import { handle } from 'lib/api/error';
import handleSupabaseError from 'lib/api/db/error';
import logger from 'lib/api/logger';
import segment from 'lib/api/segment';
import supabase from 'lib/api/supabase';
import verifyAuth from 'lib/api/verify/auth';
import verifyQueryId from 'lib/api/verify/query-id';

async function highlightAPI(
  req: Req,
  res: Res<Highlight | APIErrorJSON>
): Promise<void> {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    res.status(405).end(`Method ${req.method as string} Not Allowed`);
  } else {
    try {
      const id = verifyQueryId(req.query);
      const user = await verifyAuth(req);
      logger.verbose(`Deleting highlight (${id}) for ${user}...`);
      const { data, error } = await supabase
        .from<Highlight>('highlights')
        .update({ deleted: true })
        .eq('user', Number(user.id))
        .eq('id', id);
      handleSupabaseError('deleting', 'highlight', id, error);
      if (!data?.length) throw new APIError(`Highlight (${id}) missing`, 404);
      res.status(200).json(data[0]);
      logger.info(`Deleted highlight (${id}) for ${user}.`);
      segment.track({
        userId: user.id,
        event: 'Highlight Deleted',
        properties: data[0],
      });
    } catch (e) {
      handle(e, res);
    }
  }
}

export default withSentry(highlightAPI);
