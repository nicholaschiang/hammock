import { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import to from 'await-to-js';

import { createMessage, deleteMessage, getMessage } from 'lib/api/db/message';
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

export default async function push(req: Req, res: Res): Promise<void> {
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
      logger.verbose(
        `Fetching user (${emailAddress}) history (${historyId})...`
      );
      const user = data[0];
      const client = gmail(user.token);
      const { data: history } = await client.users.history.list({
        historyTypes: ['messageAdded', 'messageDeleted'],
        startHistoryId: historyId,
        maxResults: 500,
        userId: 'me',
      });
      logger.verbose(
        `Parsing ${history.history?.length} history records for ${user.name} (${user.id})...`
      );
      const toAdd: string[] = [];
      await Promise.all(
        (history.history || []).map(
          async ({ messagesAdded, messagesDeleted }) => {
            const added = (messagesAdded || []).map((m) => m.message);
            logger.verbose(
              `Adding ${added.length} messages for ${user.name} (${user.id})...`
            );
            await Promise.all(
              added.map(async (m) => {
                if (!m?.id) {
                  logger.error('Message missing valid identifier.');
                } else {
                  const [err] = await to(getMessage(m.id));
                  if (err) {
                    toAdd.push(m.id);
                  } else {
                    logger.verbose(`Message (${m.id}) already exists.`);
                  }
                }
              })
            );
            const deleted = (messagesDeleted || []).map((m) => m.message);
            logger.verbose(
              `Deleting ${deleted.length} messages for user (${emailAddress})...`
            );
            await Promise.all(
              deleted.map(async (m) => {
                if (!m?.id) {
                  logger.error('Message missing valid identifier.');
                } else {
                  logger.verbose(`Deleting message (${m.id})...`);
                  await deleteMessage(m.id);
                }
              })
            );
          }
        )
      );
      logger.verbose(
        `Fetching ${toAdd.length} messages for ${user.name} (${user.id})...`
      );
      const gmailMessages = await getGmailMessages(toAdd, client);
      logger.verbose(
        `Saving ${gmailMessages.length} messages for ${user.name} (${user.id})...`
      );
      await Promise.all(
        gmailMessages.map(async (gmailMessage) => {
          const msg = messageFromGmail(gmailMessage);
          msg.user = user.id;
          await createMessage(msg);
        })
      );
      res.status(200).end();
    } catch (e) {
      handle(e, res);
    }
  }
}
