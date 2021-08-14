import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { Newsletter, NewsletterJSON } from 'lib/model/newsletter';
import { APIErrorJSON } from 'lib/model/error';
import getGmailMessages from 'lib/api/get/gmail-messages';
import gmail from 'lib/api/gmail';
import { handle } from 'lib/api/error';
import logger from 'lib/api/logger';
import messageFromGmail from 'lib/api/message-from-gmail';
import segment from 'lib/api/segment';
import verifyAuth from 'lib/api/verify/auth';

export type SubscriptionsRes = {
  nextPageToken: string;
  subscriptions: NewsletterJSON[];
};

/**
 * GET - Lists the subscriptions for the given user.
 *
 * Requires a JWT; will return the subscriptions for that user.
 */
export default async function subscriptionsAPI(
  req: Req,
  res: Res<SubscriptionsRes | APIErrorJSON>
): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method as string} Not Allowed`);
  } else {
    try {
      const { pageToken } = req.query as { pageToken?: string };
      const user = await verifyAuth(req);
      logger.verbose(`Fetching subscriptions for ${user}...`);
      const client = gmail(user.token);
      const { data } = await client.users.messages.list({
        maxResults: 100,
        userId: 'me',
        pageToken,
      });
      const messageIds = (data.messages || []).map((m) => m.id as string);
      const subscriptions: Newsletter[] = [];
      (await getGmailMessages(messageIds, client, 'METADATA')).forEach((m) => {
        const msg = messageFromGmail(m);
        if (!subscriptions.some((l) => l.from.email === msg.from.email))
          subscriptions.push(msg);
      });
      res.status(200).json({
        subscriptions: subscriptions.map((s) => s.toJSON()),
        nextPageToken: data.nextPageToken || '',
      });
      logger.info(`Fetched ${subscriptions.length} subscriptions for ${user}.`);
      segment.track({ userId: user.id, event: 'Subscriptions Listed' });
    } catch (e) {
      handle(e, res);
    }
  }
}
