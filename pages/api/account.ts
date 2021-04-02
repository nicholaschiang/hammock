import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { APIErrorJSON } from 'lib/api/error';
import { User, UserJSON, isUserJSON } from 'lib/model/user';
import createLabel from 'lib/api/create/label';
import getUser from 'lib/api/get/user';
import { handle } from 'lib/api/error';
import updateAuthUser from 'lib/api/update/auth-user';
import updatePhoto from 'lib/api/update/photo';
import updateUserDoc from 'lib/api/update/user-doc';
import verifyAuth from 'lib/api/verify/auth';
import verifyBody from 'lib/api/verify/body';

async function fetchAccount(req: Req, res: Res<UserJSON>): Promise<void> {
  try {
    const { uid } = await verifyAuth(req.headers);
    const account = await getUser(uid);
    res.status(200).json(account.toJSON());
  } catch (e) {
    handle(e, res);
  }
}

async function updateAccount(req: Req, res: Res<UserJSON>): Promise<void> {
  try {
    const body = verifyBody<User, UserJSON>(req.body, isUserJSON, User);
    await verifyAuth(req.headers, { userId: body.id });
    const account = await updateAuthUser(await updatePhoto(body));
    account.label = await createLabel(account);
    await updateUserDoc(account);
    res.status(200).json(account.toJSON());
  } catch (e) {
    handle(e, res);
  }
}

/**
 * GET - Fetches the profile data of the user who own's the given JWT.
 * PUT - Updates (or creates) the user's profile data.
 *
 * Requires a JWT; will return the profile data of that user.
 */
export default async function account(
  req: Req,
  res: Res<UserJSON | APIErrorJSON>
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
