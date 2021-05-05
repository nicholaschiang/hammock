import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { APIErrorJSON } from 'lib/model/error';
import { MessageJSON } from 'lib/model/message';
import getGmailMessages from 'lib/api/get/gmail-messages';
import getUser from 'lib/api/get/user';
import gmail from 'lib/api/gmail';
import { handle } from 'lib/api/error';
import logger from 'lib/api/logger';
import { messageFromGmail } from 'lib/utils/convert';
import verifyAuth from 'lib/api/verify/auth';

export type MessagesRes = { messages: MessageJSON[]; nextPageToken: string };

/**
 * GET - Lists the messages for the given user.
 *
 * Requires a JWT; will return the messages for that user.
 */
export default async function messages(
  req: Req,
  res: Res<MessagesRes | APIErrorJSON>
): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method as string} Not Allowed`);
  } else {
    try {
      const { pageToken } = req.query as { pageToken?: string };
      const { uid } = await verifyAuth(req.headers);
      const user = await getUser(uid);
      logger.verbose(`Fetching messages for ${user}...`);
      const client = gmail(user.token);
      const { data } = await client.users.messages.list({
        labelIds: [user.label],
        maxResults: 10,
        userId: 'me',
        pageToken,
      });
      const messageIds = (data.messages || []).map((m) => m.id as string);
      const gmailMessages = await getGmailMessages(messageIds, client);
      res.status(200).json({
        nextPageToken: data.nextPageToken || '',
        messages: gmailMessages.map((m) => messageFromGmail(m).toJSON()),
      });
      logger.info(`Fetched ${messages.length} messages for ${user}.`);
    } catch (e) {
      handle(e, res);
    }
  }
}
