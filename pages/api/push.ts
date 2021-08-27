import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { createMessage, deleteMessage } from 'lib/api/db/message';
import { isDateJSON, isJSON } from 'lib/model/json';
import { APIError } from 'lib/model/error';
import { User } from 'lib/model/user';
import gmail from 'lib/api/gmail';
import { handle } from 'lib/api/error';
import handleSupabaseError from 'lib/api/db/error';
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
      const { emailAddress, historyId } = JSON.parse(
        Buffer.from(message.data, 'base64').toString('utf-8')
      ) as { emailAddress: string; historyId: string };
      const { data, error } = await supabase
        .from<User>('users')
        .select('token')
        .eq('email', emailAddress);
      if (!data?.length)
        throw new APIError(`User (${emailAddress}) not found`, 404);
      handleSupabaseError('selecting', 'user', emailAddress, error);
      const client = gmail(data[0].token);
      const { data: history } = await client.users.history.list({
        historyTypes: ['messageAdded', 'messageDeleted'],
        startHistoryId: historyId,
        maxResults: 500,
        userId: 'me',
      });
      await Promise.all(
        (history.history || []).map(
          async ({ messagesAdded, messagesDeleted }) => {
            const added = (messagesAdded || []).map((m) => m.message);
            const deleted = (messagesDeleted || []).map((m) => m.message);
            await Promise.all(
              added.map(async (m) => {
                if (m) await createMessage(messageFromGmail(m));
              })
            );
            await Promise.all(
              deleted.map(async (m) => {
                if (m?.id) await deleteMessage(m.id);
              })
            );
          }
        )
      );
      res.status(200).end();
    } catch (e) {
      handle(e, res);
    }
  }
}
