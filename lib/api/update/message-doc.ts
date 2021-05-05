import to from 'await-to-js';

import { APIError } from 'lib/model/error';
import { Message } from 'lib/model/message';
import { db } from 'lib/api/firebase';
import logger from 'lib/api/logger';

export default async function updateMessageDoc(
  uid: string,
  message: Message
): Promise<void> {
  logger.verbose(`Updating ${message} document...`);
  const ref = db
    .collection('users')
    .doc(uid)
    .collection('messages')
    .doc(message.id);
  const [err] = await to(ref.set(message.toFirestore()));
  if (err) {
    const msg = `${err.name} updating message (${message}) in database`;
    throw new APIError(`${msg}: ${err.message}`, 500);
  }
}
