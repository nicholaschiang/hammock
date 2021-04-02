import { APIError } from 'lib/model/error';
import { User } from 'lib/model/user';
import { db } from 'lib/api/firebase';
import logger from 'lib/api/logger';

export default async function getUser(uid: string): Promise<User> {
  logger.verbose(`Fetching user (${uid})...`);
  const doc = await db.collection('users').doc(uid).get();
  if (!doc.exists) throw new APIError(`User (${uid}) does not exist`, 400);
  return User.fromFirestoreDoc(doc);
}
