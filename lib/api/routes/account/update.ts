import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { User, UserJSON, isUserJSON } from 'lib/model/user';
import { handle } from 'lib/api/error';
import updateAuthUser from 'lib/api/update/auth-user';
import updatePhoto from 'lib/api/update/photo';
import updateUserDoc from 'lib/api/update/user-doc';
import verifyAuth from 'lib/api/verify/auth';
import verifyBody from 'lib/api/verify/body';

export type UpdateAccountRes = UserJSON;

export default async function updateAccount(
  req: Req,
  res: Res<UpdateAccountRes>
): Promise<void> {
  try {
    const body = verifyBody<User, UserJSON>(req.body, isUserJSON, User);
    await verifyAuth(req.headers, { userId: body.id });
    const account = await updateAuthUser(await updatePhoto(body));
    await updateUserDoc(account);
    res.status(200).json(account.toJSON());
  } catch (e) {
    handle(e, res);
  }
}
