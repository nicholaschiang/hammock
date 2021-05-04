import { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import cookie from 'cookie';
import { google } from 'googleapis';

import { APIError, APIErrorJSON } from 'lib/model/error';
import { User, UserJSON } from 'lib/model/user';
import getOrCreateFilter from 'lib/api/get/filter';
import getOrCreateLabel from 'lib/api/get/label';
import { handle } from 'lib/api/error';
import logger from 'lib/api/logger';
import oauth2Client from 'lib/api/oauth';
import updateUserDoc from 'lib/api/update/user-doc';

const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });

function fetchLoginLink(req: Req, res: Res<string | APIErrorJSON>): void {
  try {
    // We request some basic profile info and access to Gmail's API.
    // See: https://developers.google.com/identity/protocols/oauth2/scopes
    const url = oauth2Client.generateAuthUrl({
      scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/gmail.settings.basic',
        'https://www.googleapis.com/auth/gmail.labels',
      ],
      access_type: 'offline',
      prompt: 'consent',
    });
    res.setHeader('Allow', ['GET', 'OPTIONS']);
    res.status(200).end(url);
  } catch (e) {
    handle(e, res);
  }
}

async function loginUser(
  req: Req,
  res: Res<UserJSON | APIErrorJSON>
): Promise<void> {
  try {
    const { tokens } = await oauth2Client.getToken(req.query.code as string);
    if (typeof tokens.refresh_token !== 'string')
      throw new APIError('Missing refresh token; please retry login.', 401);
    if (typeof tokens.access_token !== 'string')
      throw new APIError('Missing access token; please retry login.', 401);
    if (typeof tokens.id_token !== 'string')
      throw new APIError('Missing ID token; please retry login.', 401);
    oauth2Client.credentials = tokens;
    const { email, sub } = await oauth2Client.getTokenInfo(tokens.access_token);
    const { data } = await oauth2.userinfo.get();
    const user = new User({
      id: data.id || sub,
      name: data.name || '',
      photo: data.picture || '',
      locale: data.locale || '',
      gender: data.gender || '',
      email: data.email || email,
      token: tokens.refresh_token,
    });
    user.label = await getOrCreateLabel(user);
    user.filter = await getOrCreateFilter(user);
    await updateUserDoc(user);
    logger.info(`Updated ${user.toString()}.`);
    res.setHeader(
      'Set-Cookie',
      cookie.serialize('token', tokens.id_token, {
        httpOnly: true,
        secure: true,
      })
    );
    res.redirect('/letters');
  } catch (e) {
    handle(e, res);
  }
}

/**
 * GET - Gets a Google OAuth login link with basic profile and Gmail API scopes.
 * PUT - Uses the given OAuth redirect code to:
 *       1. Get and save the user's basic profile info (e.g. name, avatar).
 *       2. Set an authentication cookie for future requests.
 */
export default async function login(
  req: Req,
  res: Res<string | UserJSON | APIErrorJSON>
): Promise<void> {
  switch (req.method) {
    case 'OPTIONS':
      fetchLoginLink(req, res);
      break;
    case 'GET':
      await loginUser(req, res);
      break;
    default:
      res.setHeader('Allow', ['GET', 'OPTIONS']);
      res.status(405).end(`Method ${req.method as string} Not Allowed`);
  }
}
