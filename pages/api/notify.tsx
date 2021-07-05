import { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import mail, { MailDataRequired } from '@sendgrid/mail';
import { renderToStaticMarkup } from 'react-dom/server';

import Email from 'components/email';

import { APIError, APIErrorJSON } from 'lib/model/error';
import { Message } from 'lib/model/message';
import { User } from 'lib/model/user';
import { db } from 'lib/api/firebase';
import { handle } from 'lib/api/error';
import logger from 'lib/api/logger';

/**
 * GET - Sends notification emails with a summary of all the new newsletters in
 *       the user's feed (from the last 24 hours).
 *
 * Requires a specific authorization token known only by our CRON job.
 */
export default async function notifyAPI(
  req: Req,
  res: Res<APIErrorJSON>
): Promise<void> {
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
      const { docs: users } = await db
        .collection('users')
        .where('email', 'in', [
          'martin.srna@gmail.com',
          'juraj.pal@gmail.com',
          'elizabeth@deepnote.com',
          'alex.neczli@gmail.com',
          'nicholas.h.chiang@gmail.com',
        ])
        .get();
      const emails: MailDataRequired[] = [];
      logger.info(`Fetching messages for ${users.length} users...`);
      await Promise.all(
        users.map(async (doc) => {
          // TODO: Sync the latest Gmail messages before fetching these.
          // TODO: Filter for message dates that are today in the user's time zone
          // (this will require us to store user time zones in our db).
          const user = User.fromFirestoreDoc(doc);
          logger.verbose(`Fetching messages for ${user}...`);
          const { docs } = await doc.ref
            .collection('messages')
            .where('date', '>=', today)
            .orderBy('date', 'desc')
            .limit(10)
            .get();
          const messages = docs.map((d) => Message.fromFirestoreDoc(d));
          if (!messages.length) {
            logger.verbose(
              `Skipping email for ${user} with no new messages...`
            );
          } else {
            logger.verbose(
              `Queuing email for ${user} with ${messages.length} new messages...`
            );
            emails.push({
              to: { name: user.name, email: user.email },
              from: { name: 'Hammock', email: 'team@readhammock.com' },
              bcc: { name: 'Hammock', email: 'team@readhammock.com' },
              subject: `Read in Hammock: ${messages
                .slice(0, 3)
                .map((m) => m.from.name)
                .join(', ')}`,
              html: renderToStaticMarkup(
                <Email user={user} messages={messages} />
              ),
              asm: { groupId: 23193 },
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
