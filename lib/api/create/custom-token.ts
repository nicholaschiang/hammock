import to from 'await-to-js';

import { FirebaseError, auth } from 'lib/api/firebase';
import { APIError } from 'lib/api/error';

/**
 * @param uid - The user ID of the user to create the login token for.
 * @return Promise that resolves with a custom Firebase Authentication token
 * that the client can then use to login.
 */
export default async function createCustomToken(uid: string): Promise<string> {
  const [err, token] = await to<string, FirebaseError>(
    auth.createCustomToken(uid)
  );
  if (err) {
    const msg = `${err.name} (${err.code}) creating custom auth token`;
    throw new APIError(`${msg} for user (${uid}): ${err.message}`, 500);
  }
  return token as string;
}
