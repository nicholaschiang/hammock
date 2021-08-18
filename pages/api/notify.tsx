import { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import mail, { MailDataRequired } from '@sendgrid/mail';
import { renderToStaticMarkup } from 'react-dom/server';
import to from 'await-to-js';
import { withSentry } from '@sentry/nextjs';

import Email from 'components/email';

import { APIError, APIErrorJSON } from 'lib/model/error';
import { Message } from 'lib/model/message';
import { User } from 'lib/model/user';
import { handle } from 'lib/api/error';
import logger from 'lib/api/logger';
import supabase from 'lib/api/supabase';
import syncGmail from 'lib/api/sync-gmail';

/**
 * GET - Sends notification emails with a summary of all the new newsletters in
 *       the user's feed (from the last 24 hours).
 *
 * Requires a specific authorization token known only by our CRON job.
 */
async function notifyAPI(req: Req, res: Res<APIErrorJSON>): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method as string} Not Allowed`);
  } else {
    try {
      if (typeof req.query.token !== 'string')
        throw new APIError('Missing authentication token', 401);
      if (req.query.token !== process.env.NOTIFY_TOKEN)
        throw new APIError('Invalid authentication token', 401);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      logger.info('Fetching users...');
      // TODO: Once this lands from experimental, send notifications to everyone
      // instead of just these five beta test users.
      const { data: users } = await supabase.from<User>('users').select();
      const emails: MailDataRequired[] = [];
      logger.info(`Fetching messages for ${users?.length} users...`);
      await Promise.all(
        (users || []).map(async (user) => {
          // TODO: Filter for message dates that are today in the user's time zone
          // (this will require us to store user time zones in our db).
          logger.verbose(`Syncing messages for ${user}...`);
          // We only have to sync the latest 10 messages because that's all that
          // we're looking at in our email notification anyways. That's why this
          // doesn't care about the `nextPageToken` and isn't recursive.
          const [e] = await to(syncGmail(user));
          if (e) logger.warn(`Error syncing ${user}'s messages: ${e.stack}`);
          logger.verbose(`Fetching messages for ${user}...`);
          const { data: messages } = await supabase
            .from<Message>('messages')
            .select()
            .eq('user', user.id)
            .gte('date', today.toISOString())
            .order('date', { ascending: false })
            .limit(3);
          if (!messages?.length) {
            logger.verbose(
              `Skipping email for ${user} with no new messages...`
            );
          } else {
            logger.verbose(
              `Queuing email for ${user} with ${messages.length} new messages...`
            );
            emails.push({
              to: { name: user.name, email: user.email || '' },
              from: { name: 'Hammock', email: 'team@readhammock.com' },
              bcc: { name: 'Hammock', email: 'team@readhammock.com' },
              subject: `Read in Hammock: ${messages
                .map((m) => m.name)
                .join(', ')}`,
              html: renderToStaticMarkup(
                <Email user={user} messages={messages} />
              ),
              asm: { groupId: 23193, groupsToDisplay: [23193] },
            });
          }
        })
      );
      logger.info(`Sending ${emails.length} emails...`);
      if (typeof process.env.SENDGRID_API_KEY !== 'string')
        throw new APIError('Missing SendGrid API key', 401);
      mail.setApiKey(process.env.SENDGRID_API_KEY);
      await mail.send(emails);
      res.status(200).end(`${emails.length} Emails Sent`);
    } catch (e) {
      handle(e, res);
    }
  }
}

export default withSentry(notifyAPI);
