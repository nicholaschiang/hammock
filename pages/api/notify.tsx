import { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import mail, { MailDataRequired } from '@sendgrid/mail';
import { renderToStaticMarkup } from 'react-dom/server';

import Section from 'components/section';

import { APIError, APIErrorJSON } from 'lib/model/error';
import { Message } from 'lib/model/message';
import { User } from 'lib/model/user';
import { db } from 'lib/api/firebase';
import { handle } from 'lib/api/error';
import logger from 'lib/api/logger';

interface EmailProps {
  user: User;
  messages: Message[];
}

function Email({ user, messages }: EmailProps): JSX.Element {
  // TODO: Ensure that this email formatting works both in the browser (b/c I'm
  // reusing the same `Section` component) and in Gmail (we only have to care
  // about the Gmail email client b/c we know all our users are on Gmail).
  return (
    <div>
      <p>Hi {user.name}, here’s what’s new in Hammock today:</p>
      <Section header='Today' messages={messages.map((m) => m.toJSON())} />
    </div>
  );
}

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
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      logger.info('Fetching users...');
      const { docs: users } = await db.collection('users').get();
      const emails: MailDataRequired[] = [];
      logger.info(`Fetching messages for ${users.length} users...`);
      await Promise.all(users.map(async (doc) => {
        // TODO: Sync the latest Gmail messages before fetching these.
        // TODO: Filter for message dates that are today in the user's time zone
        // (this will require us to store user time zones in our db).
        const user = User.fromFirestoreDoc(doc);
        logger.verbose(`Fetching messages for ${user}...`);
        const { docs } = await doc.ref.collection('messages').where('date', '>=', today).orderBy('date', 'desc').limit(10).get();
        const messages = docs.map((d) => Message.fromFirestoreDoc(d));
        if (!messages.length) {
          logger.verbose(`Skipping email for ${user} with no new messages...`);
        } else {
          logger.verbose(`Queuing email for ${user} with ${messages.length} new messages...`);
          emails.push({
            to: { name: user.name, email: user.email },
            from: { name: 'Hammock', email: 'feed@readhammock.com' },
            subject: 'See what’s new in your Hammock feed',
            html: renderToStaticMarkup(
              <Email user={user} messages={messages} />
            ),
          });
        }
      }));
      logger.info(`Sending ${emails.length} emails...`);
      if (typeof process.env.SENDGRID_API_KEY !== 'string')
        throw new APIError('Missing SendGrid API key', 401);
      mail.setApiKey(process.env.SENDGRID_API_KEY);
      await mail.send(emails);
    } catch (e) {
      handle(e, res);
    }
  }
}
