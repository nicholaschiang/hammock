import { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import cookie from 'cookie';

/**
 * GET - Logs the user out by removing the HttpOnly authentication cookie and
 *       redirecting to the login page.
 */
export default async function logout(req: Req, res: Res): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method as string} Not Allowed`);
  } else {
    res.setHeader(
      'Set-Cookie',
      cookie.serialize('token', '', {
        expires: new Date(0),
        httpOnly: true,
        secure: true,
      })
    );
    res.status(200).end();
  }
}
