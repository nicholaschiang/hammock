import { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import { withSentry } from '@sentry/nextjs';

import { createMessage, deleteMessage } from 'lib/api/db/message';
import { isDateJSON, isJSON } from 'lib/model/json';
import { APIError } from 'lib/model/error';
import { User } from 'lib/model/user';
import getGmailMessages from 'lib/api/get/gmail-messages';
import gmail from 'lib/api/gmail';
import { handle } from 'lib/api/error';
import handleSupabaseError from 'lib/api/db/error';
import logger from 'lib/api/logger';
import messageFromGmail from 'lib/api/message-from-gmail';
import supabase from 'lib/api/supabase';
import verifyBody from 'lib/api/verify/body';

interface PushMessage {
  message: { data: string; messageId: string; publishTime: string };
  subscription: string;
}

function isPushMessage(msg: unknown): msg is PushMessage {
  if (!isJSON(msg)) throw new APIError('Expected valid JSON body', 400);
  if (!isJSON(msg.message))
    throw new APIError('Expected valid nested message object', 400);
  if (typeof msg.message.data !== 'string')
    throw new APIError('Expected valid string `message.data` field', 400);
  if (typeof msg.message.messageId !== 'string')
    throw new APIError('Expected valid string `message.messageId` field', 400);
  if (!isDateJSON(msg.message.publishTime))
    throw new APIError('Expected valid date `message.publishTime` field', 400);
  if (typeof msg.subscription !== 'string')
    throw new APIError('Expected valid string `subscription` field', 400);
  return true;
}

async function pushAPI(req: Req, res: Res): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method as string} Not Allowed`);
  } else {
    try {
      // The actual data payload is base64 encoded in the `message.data` field.
      // @see {@link https://developers.google.com/gmail/api/guides/push#receiving_notifications}
      const { message } = verifyBody<PushMessage>(req.body, isPushMessage);
      logger.verbose(`Parsing message body (${message.data})...`);
      const { emailAddress, historyId } = JSON.parse(
        Buffer.from(message.data, 'base64').toString('utf-8')
      ) as { emailAddress: string; historyId: string };
      logger.verbose(`Fetching user (${emailAddress}) token...`);
      const { data, error } = await supabase
        .from<User>('users')
        .select()
        .eq('email', emailAddress);
      if (!data?.length)
        throw new APIError(`User (${emailAddress}) not found`, 404);
      handleSupabaseError('selecting', 'user', emailAddress, error);
      const user = data[0];
      const userStr = `${user.name} (${user.id})`;
      logger.verbose(`Fetching history (${historyId}) for ${userStr}...`);
      const client = gmail(user.token);
      const { data: history } = await client.users.history.list({
        historyTypes: ['messageAdded', 'messageDeleted'],
        startHistoryId: historyId,
        maxResults: 500,
        userId: 'me',
      });
      // We have to keep track of which messages were added/deleted when to
      // cover edge cases where, for example:
      // 1. The 1st history record contains message A in `messagesAdded`.
      // 2. The 2nd history record contains message B in `messagesAdded`.
      // 3. The 3rd history record contains messages A in `messagesDeleted`.
      // In that case, we want to only try to fetch and add message B.
      const deleted = new Set<string>();
      const added = new Set<string>();
      const length = history.history?.length || 0;
      logger.verbose(`Parsing ${length} history records for ${userStr}...`);
      history.history?.forEach(({ messagesAdded, messagesDeleted }) => {
        messagesAdded?.forEach((m) => {
          if (m.message?.id) {
            deleted.delete(m.message.id);
            added.add(m.message.id);
          } else {
            logger.warn(`Message added (${JSON.stringify(m)}) missing ID.`);
          }
        });
        messagesDeleted?.forEach((m) => {
          if (m.message?.id) {
            added.delete(m.message.id);
            deleted.add(m.message.id);
          } else {
            logger.warn(`Message deleted (${JSON.stringify(m)}) missing ID.`);
          }
        });
      });
      logger.verbose(`Deleting ${deleted.size} messages for ${userStr}...`);
      await Promise.all([...deleted].map((id) => deleteMessage(id)));
      logger.verbose(`Fetching ${added.size} messages for ${userStr}...`);
      const gmailMessages = await getGmailMessages([...added], client);
      // TODO: How does this handle a message that has changed in Gmail but
      // already exists in our database (e.g. updates v.s. upserts)?
      const msgs = gmailMessages
        .map((m) => ({ ...messageFromGmail(m), user: user.id }))
        .filter((m) => {
          const log = `${m.name} (${m.email}) with subject (${m.subject})`;
          if (user.subscriptions.some((s) => s.email === m.email)) {
            logger.debug(`Saving message (${m.id}) from ${log}...`);
            return true;
          }
          logger.debug(`Skipping message (${m.id}) from ${log}...`);
          return false;
        });
      logger.verbose(`Creating ${msgs.length} messages for ${userStr}...`);
      await Promise.all(msgs.map((m) => createMessage(m)));
      res.status(200).end();
    } catch (e) {
      handle(e, res);
    }
  }
}

export default withSentry(pushAPI);
