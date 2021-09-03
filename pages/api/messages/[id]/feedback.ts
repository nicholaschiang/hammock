import { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import { withSentry } from '@sentry/nextjs';

import { APIError, APIErrorJSON } from 'lib/model/error';
import { Feedback, isFeedback } from 'lib/model/feedback';
import { handle } from 'lib/api/error';
import handleSupabaseError from 'lib/api/db/error';
import logger from 'lib/api/logger';
import segment from 'lib/api/segment';
import supabase from 'lib/api/supabase';
import verifyAuth from 'lib/api/verify/auth';
import verifyBody from 'lib/api/verify/body';

async function createFeedback(
  req: Req,
  res: Res<Feedback | APIErrorJSON>
): Promise<void> {
  try {
    console.time('create-feedback-api');
    const body = verifyBody<Feedback>(req.body, isFeedback);
    const user = await verifyAuth(req);
    if (Number(user.id) !== body.user)
      throw new APIError('You can only create feedback from yourself', 403);
    logger.info(`Creating ${body.emoji} feedback (${body.feedback})...`);
    const { data, error } = await supabase
      .from<Feedback>('feedback')
      .insert({ ...body, id: undefined });
    handleSupabaseError('creating', 'feedback', body, error);
    res.status(201).json(data ? data[0] : body);
    logger.info(`Created feedback (${data ? data[0].id : ''}) for ${user}.`);
    console.timeEnd('create-feedback-api');
    segment.track({
      userId: user.id,
      event: 'Feedback Created',
      properties: data ? data[0] : body,
    });
  } catch (e) {
    handle(e, res);
  }
}

async function feedbackAPI(
  req: Req,
  res: Res<Feedback[] | Feedback | APIErrorJSON>
): Promise<void> {
  switch (req.method) {
    case 'POST':
      await createFeedback(req, res);
      break;
    default:
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${req.method as string} Not Allowed`);
  }
}

export default withSentry(feedbackAPI);
