import { NextApiRequest } from 'next';
import { getSession } from 'next-auth/client';
import { nanoid } from 'nanoid';
import { setUser } from '@sentry/nextjs';

import { APIError } from 'lib/model/error';
import { User } from 'lib/model/user';
import logger from 'lib/api/logger';

/**
 * Verifies the authorization header by:
 * 1. Checking that it contains a valid Firebase Authorization JWT.
 * 2. (Optional) Verifying that the JWT belongs to a certain user.
 * @param headers - The request headers to verify.
 * @param [uid] - Specify a user that the JWT must be owned by (see above).
 * @return Promise that resolves to the authenticated user's uID; throws an
 * `APIError` if the user is unauthenticated.
 * @example
 * // Verify request is from a logged-in user.
 * await verifyAuth(req.headers);
 * // Verify request is from user with uID `student`.
 * await verifyAuth(req.headers, 'student');
 */
export default async function verifyAuth(
  req: NextApiRequest,
  requiredUserId?: number
): Promise<User> {
  const timeId = `verify-auth-${nanoid()}`;
  console.time(timeId);
  logger.verbose('Verifying authentication session...');
  const session = await getSession({ req });
  console.timeEnd(timeId);
  if (!session) throw new APIError('You are not authenticated', 401);
  const { user } = session;
  setUser({
    id: user.id.toString(),
    username: user.name,
    email: user.email || undefined,
  });
  // TODO: Throw a `403 Forbidden` error here instead of a `401 Unauthorized`.
  if (requiredUserId && user.id !== requiredUserId)
    throw new APIError('You are not authorized to perform this action', 401);
  return user;
}
