import to from 'await-to-js';
import phone from 'phone';

import { FirebaseError, UserRecord, auth } from 'lib/api/firebase';
import { APIError } from 'lib/api/error';
import { User } from 'lib/model/user';
import clone from 'lib/utils/clone';

export default async function updateAuthUser(user: User): Promise<User> {
  const [err, userRecord] = await to<UserRecord, FirebaseError>(
    auth.updateUser(user.id, {
      disabled: false,
      email: user.email,
      emailVerified: false,
      displayName: user.name,
      photoURL: user.photo || undefined,
      phoneNumber: phone(user.phone)[0] || undefined,
    })
  );
  if (err) {
    if (['development', 'test'].includes(process.env.APP_ENV as string))
      return new User(clone(user));
    const msg = `${err.name} (${err.code}) updating auth account`;
    throw new APIError(`${msg} for ${user.toString()}: ${err.message}`, 500);
  }
  const record = userRecord as UserRecord;
  const updatedUser = new User(
    clone({
      ...user,
      email: record.email,
      phone: record.phoneNumber,
      photo: record.photoURL,
      name: record.displayName,
      id: record.uid,
    })
  );
  return updatedUser;
}
