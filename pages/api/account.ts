import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import fetchAccount, { FetchAccountRes } from 'lib/api/routes/account/fetch';
import updateAccount, { UpdateAccountRes } from 'lib/api/routes/account/update';
import { APIError } from 'lib/api/error';

/**
 * GET - Fetches the profile data of the user who own's the given JWT.
 * PUT - Updates (or creates) the user's profile data.
 *
 * Requires a JWT; will return the profile data of that user.
 */
export default async function account(
  req: Req,
  res: Res<FetchAccountRes | UpdateAccountRes | APIError>
): Promise<void> {
  switch (req.method) {
    case 'GET':
      await fetchAccount(req, res);
      break;
    case 'PUT':
      await updateAccount(req, res);
      break;
    default:
      res.setHeader('Allow', ['GET', 'PUT']);
      res.status(405).end(`Method ${req.method as string} Not Allowed`);
  }
}
