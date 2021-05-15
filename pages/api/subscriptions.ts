import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { Subscription, SubscriptionJSON } from 'lib/model/subscription';
import { APIErrorJSON } from 'lib/model/error';
import getGmailMessages from 'lib/api/get/gmail-messages';
import gmail from 'lib/api/gmail';
import { handle } from 'lib/api/error';
import logger from 'lib/api/logger';
import messageFromGmail from 'lib/api/message-from-gmail';
import verifyAuth from 'lib/api/verify/auth';

export type SubscriptionsRes = {
  nextPageToken: string;
  subscriptions: SubscriptionJSON[];
};

/**
 * GET - Lists the subscriptions for the given user.
 *
 * Requires a JWT; will return the subscriptions for that user.
 */
export default async function subscriptions(
  req: Req,
  res: Res<SubscriptionsRes | APIErrorJSON>
): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method as string} Not Allowed`);
  } else {
    try {
      const { pageToken } = req.query as { pageToken?: string };
      const { uid, token } = await verifyAuth(req.headers);
      logger.verbose(`Fetching subscriptions for user (${uid})...`);
      const client = gmail(token);
      const { data } = await client.users.messages.list({
        maxResults: 100,
        userId: 'me',
        pageToken,
      });
      const messageIds = (data.messages || []).map((m) => m.id as string);
      const subscriptionsData: Subscription[] = [];
      (await getGmailMessages(messageIds, client, 'METADATA')).forEach((m) => {
        const msg = messageFromGmail(m);
        if (!subscriptionsData.some((l) => l.from.email === msg.from.email))
          subscriptionsData.push(msg);
      });
      res.status(200).json({
        subscriptions: subscriptionsData.map((s) => s.toJSON()),
        nextPageToken: data.nextPageToken || '',
      });
      logger.info(
        `Fetched ${subscriptionsData.length} subscriptions for user (${uid}).`
      );
    } catch (e) {
      handle(e, res);
    }
  }
}
