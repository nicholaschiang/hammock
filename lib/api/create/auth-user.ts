import { nanoid } from 'nanoid';
import to from 'await-to-js';
import phone from 'phone';

import { FirebaseError, UserRecord, auth } from 'lib/api/firebase';
import { APIError } from 'lib/model/error';
import { User } from 'lib/model/user';
import clone from 'lib/utils/clone';
import logger from 'lib/api/logger';

export default async function createAuthUser(user: User): Promise<User> {
  logger.verbose(`Creating ${user}...`);
  const [err, userRecord] = await to<UserRecord, FirebaseError>(
    auth.createUser({
      disabled: false,
      email: user.email || undefined,
      emailVerified: false,
      displayName: user.name,
      photoURL: user.photo || undefined,
      phoneNumber: phone(user.phone)[0] || undefined,
    })
  );
  if (err) {
    if (['development', 'test'].includes(process.env.APP_ENV as string))
      return new User(clone({ ...user, id: user.id || nanoid() }));
    const msg = `${err.name} (${err.code}) creating auth account`;
    throw new APIError(`${msg} for ${user.toString()}: ${err.message}`, 500);
  }
  const record = userRecord as UserRecord;
  const createdUser = new User(
    clone({
      ...user,
      email: record.email,
      phone: record.phoneNumber,
      photo: record.photoURL,
      name: record.displayName,
      id: record.uid,
    })
  );
  return createdUser;
}
