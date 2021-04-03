import { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import { dequal } from 'dequal';
import to from 'await-to-js';

import { APIErrorJSON } from 'lib/model/error';
import { User, UserInterface, UserJSON, isUserJSON } from 'lib/model/user';
import getOrCreateFilter from 'lib/api/get/filter';
import getOrCreateLabel from 'lib/api/get/label';
import getUser from 'lib/api/get/user';
import { handle } from 'lib/api/error';
import updateAuthUser from 'lib/api/update/auth-user';
import updateUserDoc from 'lib/api/update/user-doc';
import verifyAuth from 'lib/api/verify/auth';
import verifyBody from 'lib/api/verify/body';
import retroactivelyFilterMessages from 'lib/api/update/filter-messages';
import logger from 'lib/api/logger';
import clone from 'lib/utils/clone';

async function fetchAccount(req: Req, res: Res<UserJSON>): Promise<void> {
  console.time('get-account');
  try {
    const { uid } = await verifyAuth(req.headers);
    const account = await getUser(uid);
    res.status(200).json(account.toJSON());
    logger.info(`Fetched ${account}.`);
  } catch (e) {
    handle(e, res);
  }
  console.timeEnd('get-account');
}

function mergeArrays<T>(overrides: T[], baseline: T[]): T[] {
  const merged = clone(overrides);
  baseline.forEach((i) => {
    if (!merged.some((im) => dequal(im, i))) merged.push(clone(i));
  });
  return merged;
}

function mergeUsers(overrides: User, baseline: User): User {
  const merged: UserInterface = {
    id: overrides.id || baseline.id,
    name: overrides.name || baseline.name,

    // Don't override an existing profile picture when the user is logging in
    // with Google. Typically, the existing picture will be better (e.g. higher
    // quality and an actual face instead of a letter) than the Google avatar.
    photo: baseline.photo || overrides.photo,

    email: overrides.email || baseline.email,
    phone: overrides.phone || baseline.phone,
    token: overrides.token || baseline.token,
    label: overrides.label || baseline.label,
    filter: {
      id: overrides.filter.id || baseline.filter.id,
      senders: mergeArrays(overrides.filter.senders, baseline.filter.senders),
    },

    // Don't override the existing creation timestamp. These will be updated by
    // Firestore data conversion methods anyways, so it doesn't really matter.
    created: baseline.created || overrides.created,
    updated: overrides.updated || baseline.updated,
  };
  return new User(merged);
}

async function patchAccount(req: Req, res: Res<UserJSON>): Promise<void> {
  console.time('patch-account');
  try {
    const body = verifyBody<User, UserJSON>(req.body, isUserJSON, User);
    await verifyAuth(req.headers, { userId: body.id });

    // Merge the two users giving priority to the request body (but preventing
    // any loss of data; `mergeUsers` won't allow falsy values or empty arrays).
    const original = (await to(getUser(body.id)))[1];
    const merged = mergeUsers(body, original || new User());
    const account = await updateAuthUser(merged);

    await updateUserDoc(account);

    res.status(200).json(account.toJSON());
    logger.info(`Patched ${account}.`);
  } catch (e) {
    handle(e, res);
  }
  console.timeEnd('patch-account');
}

async function updateAccount(req: Req, res: Res<UserJSON>): Promise<void> {
  console.time('put-account');
  try {
    const body = verifyBody<User, UserJSON>(req.body, isUserJSON, User);
    await verifyAuth(req.headers, { userId: body.id });

    const account = await updateAuthUser(body);
    account.label = await getOrCreateLabel(account);
    account.filter = await getOrCreateFilter(account);

    await updateUserDoc(account);

    res.status(200).json(account.toJSON());
    logger.info(`Updated ${account}.`);

    await retroactivelyFilterMessages(account);
    logger.info(`Retroactively filtered messages for ${account}.`);
  } catch (e) {
    handle(e, res);
  }
  console.timeEnd('put-account');
}

/**
 * GET - Fetches the user's profile data. Called continuously.
 * PUT - Updates and overwrites the user's profile data. Called after setup.
 * PATCH - Partially updates the user's profile data (merges the request body
 * with the existing data if present). Called after login.
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
    case 'PATCH':
      await patchAccount(req, res);
      break;
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'PATCH']);
      res.status(405).end(`Method ${req.method as string} Not Allowed`);
  }
}
