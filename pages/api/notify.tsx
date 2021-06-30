import { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import mail, { MailDataRequired } from '@sendgrid/mail';
import { renderToStaticMarkup } from 'react-dom/server';

import { APIErrorJSON } from 'lib/model/error';
import { handle } from 'lib/api/error';
import logger from 'lib/api/logger';
import verifyAuth from 'lib/api/verify/auth';
import { db } from 'lib/api/firebase';

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
      const { docs: users } = await db.collection('users').get();
      const emails: MailDataRequired[] = [];
      await Promise.all(users.map(async (doc) => {
        // TODO: Sync the latest Gmail messages before fetching these.
        // TODO: Filter for message dates that are today in the user's time zone
        // (this will require us to store user time zones in our db).
        const { docs } = await doc.ref.collection('messages').where('date', '>=', today).orderBy('date', 'desc').limit(10).get();
        const messages = docs.map((d) => Message.fromFirestoreDoc(d));
        const user = User.fromFirestoreDoc(doc);
        emails.push({
          to: { name: user.name, email: user.email },
          from: { name: 'Hammock', email: 'feed@readhammock.com' },
          subject: 'See what’s new in your Hammock feed',
          html: renderToStaticMarkup(
            <FeedEmail user={user} messages={messages} />
          ),
        });
      }));
      mail.setApiKey(process.env.SENDGRID_API);
      await mail.send(emails);
    } catch (e) {
      handle(e, res);
    }
  }
}
