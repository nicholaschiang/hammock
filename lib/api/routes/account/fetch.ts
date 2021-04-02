import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { UserJSON } from 'lib/model/user';
import getUser from 'lib/api/get/user';
import { handle } from 'lib/api/error';
import verifyAuth from 'lib/api/verify/auth';

export type FetchAccountRes = UserJSON;

export default async function fetchAccount(
  req: Req,
  res: Res<FetchAccountRes>
): Promise<void> {
  try {
    const { uid } = await verifyAuth(req.headers);
    const account = await getUser(uid);
    res.status(200).json(account.toJSON());
  } catch (e) {
    handle(e, res);
  }
}
