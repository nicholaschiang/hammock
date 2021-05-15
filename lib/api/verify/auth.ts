import { IncomingHttpHeaders } from 'http';

import cookie from 'cookie';
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
): Promise<{ uid: string; token: string }> {
  console.time('verify-auth');
  logger.verbose('Verifying authentication cookie...');

  if (typeof headers.cookie !== 'string')
    throw new APIError('You must provide a valid authorization cookie', 401);

  const { token } = cookie.parse(headers.cookie);
  oauth2Client.setCredentials({ refresh_token: token });
  const [e, res] = await to(oauth2Client.getAccessToken());
  if (e) throw new APIError(`Your auth is invalid: ${e.message}`, 401);

  const [err, info] = await to(oauth2Client.getTokenInfo(res?.token || ''));
  if (err) throw new APIError(`Your auth is invalid: ${err.message}`, 401);

  const uid = info ? info.user_id || info.sub : undefined;

  if (typeof uid !== 'string')
    throw new APIError('Could not fetch valid user ID from JWT', 401);
  if (requiredUserId && uid !== requiredUserId)
    throw new APIError('You are not authorized to perform this action', 401);

  console.timeEnd('verify-auth');
  return { uid, token };
}
