import NextAuth from 'next-auth';
import Providers from 'next-auth/providers';
import { nanoid } from 'nanoid';
import to from 'await-to-js';

import { SCOPES, User } from 'lib/model/user';
import { getUser, upsertUser } from 'lib/api/db/user';
import getOrCreateFilter from 'lib/api/get/filter';
import getOrCreateLabel from 'lib/api/get/label';
import logger from 'lib/api/logger';
import syncGmail from 'lib/api/gmail/sync';
import watchGmail from 'lib/api/gmail/watch';

export default NextAuth({
  providers: [
    Providers.Google({
      clientId: process.env.OAUTH_CLIENT_ID,
      clientSecret: process.env.OAUTH_CLIENT_SECRET,
      authorizationUrl:
        'https://accounts.google.com/o/oauth2/v2/auth?prompt=consent&access_type=offline&response_type=code',
      // These are the Gmail scopes that Hammock requires in order to function.
      // @see {@link https://developers.google.com/identity/protocols/oauth2/scopes#gmail}
      scope: Object.values(SCOPES).join(' '),
      profile(profile) {
        return {
          id: Number(profile.id) as number & string,
          name: profile.name,
          photo: profile.picture,
          locale: profile.locale,
          email: profile.email,
          phone: null,
          token: '',
          label: '',
          filter: '',
          subscriptions: [],
          scopes: [],
        };
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
    newUser: '/subscriptions',
  },
  callbacks: {
    redirect(url, baseUrl) {
      if (url.startsWith('/')) return url;
      if (url.startsWith(baseUrl)) return url;
      return baseUrl;
    },
    async jwt(token, user, account, profile) {
      const timeId = `process-jwt-${nanoid()}`;
      console.time(timeId);
      logger.verbose(`Processing JWT for user (${token.sub})...`);
      if (user && account && profile) {
        const created = {
          ...(user as User),
          id: Number(account.id || profile.id || user.id || token.sub),
          name: profile.name || user.name || token.name || '',
          photo: profile.image || user.photo || token.picture || '',
          email: profile.email || user.email || token.email || '',
          locale: profile.locale || user.locale,
          scopes: (account.scope as string).split(' '),
          token: account.refresh_token || '',
        };
        logger.verbose(`Fetching ${created.name} (${created.id})...`);
        const res = (await to(getUser(created.id)))[1];
        created.subscriptions = res?.subscriptions || [];
        created.label = res?.label || (await getOrCreateLabel(created));
        created.filter = res?.filter || (await getOrCreateFilter(created));
        logger.verbose(`Creating ${created.name} (${created.id})...`);
        await Promise.all([
          upsertUser(created),
          to(syncGmail(created)),
          to(watchGmail(created)),
        ]);
      }
      // Don't include user data in the JWT because it's larger than the max
      // cookie payload size supported by most browsers (~4096 bytes).
      // @see {@link https://next-auth.js.org/faq#what-are-the-disadvantages-of-json-web-tokens}
      // @see {@link http://browsercookielimits.iain.guru/}
      console.timeEnd(timeId);
      return token;
    },
    async session(session, token) {
      // Instead of including user data in the JWT itself (because of cookie
      // payload size limits), I fetch that data from our database here.
      // @see {@link https://next-auth.js.org/configuration/callbacks#session-callback}
      const timeId = `fetch-session-${nanoid()}`;
      console.time(timeId);
      const user = await getUser(Number((token as { sub: string }).sub));
      logger.verbose(`Fetching session for ${user.name} (${user.id})...`);
      console.timeEnd(timeId);
      return { ...session, user };
    },
  },
  secret: process.env.AUTH_SECRET,
  jwt: {
    secret: process.env.AUTH_SECRET,
    signingKey:
      '{"kty":"oct","kid":"SUmM9tnlyuJA7zSaWZQ5QCvr9JOg2FcXEVHDUyRQjLA","alg":"HS512","k":"iu25tYNV3q2M1hny1LcgGKMWZCzNDowps7v8ZNDxsaFa7e7mUqG6qCnqcpOivEoJOC5SXlZXAEnxu05QtVSO9A"}',
  },
});
