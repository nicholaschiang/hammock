import { IncomingHttpHeaders } from 'http';

import cookie from 'cookie';
import { LoginTicket } from 'google-auth-library';
import to from 'await-to-js';

import { APIError } from 'lib/model/error';
import logger from 'lib/api/logger';
import oauth2Client from 'lib/api/oauth';

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
  headers: IncomingHttpHeaders,
  requiredUserId?: string
): Promise<{ uid: string }> {
  logger.verbose('Verifying authentication cookie...');

  if (typeof headers.cookie !== 'string')
    throw new APIError('You must provide a valid authorization cookie', 401);

  const { token } = cookie.parse(headers.cookie);
  const [err, ticket] = await to<LoginTicket>(
    oauth2Client.verifyIdToken({
      idToken: token,
      audience: process.env.OAUTH_CLIENT_ID,
    })
  );

  if (err) throw new APIError(`Your JWT is invalid: ${err.message}`, 401);

  const uid = (ticket as LoginTicket).getUserId();

  if (typeof uid !== 'string')
    throw new APIError('Could not fetch valid user ID from JWT', 401);
  if (requiredUserId && uid !== requiredUserId)
    throw new APIError('You are not authorized to perform this action', 401);

  return { uid };
}
