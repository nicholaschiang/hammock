import NextAuth from 'next-auth';
import Providers from 'next-auth/providers';
import to from 'await-to-js';

import { SCOPES, User, UserJSON } from 'lib/model/user';
import getOrCreateFilter from 'lib/api/get/filter';
import getOrCreateLabel from 'lib/api/get/label';
import getUser from 'lib/api/get/user';
import logger from 'lib/api/logger';
import syncGmail from 'lib/api/sync-gmail';
import updateUserDoc from 'lib/api/update/user-doc';

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
        const user: UserJSON = {
          id: profile.id,
          name: profile.name,
          photo: profile.picture,
          locale: profile.locale,
          email: profile.email,
          phone: '',
          token: '',
          label: '',
          filter: '',
          subscriptions: [],
          scopes: [],
        };
        return user as UserJSON & Record<string, unknown>;
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
      console.time('process-jwt');
      logger.verbose(`Processing JWT for user (${token.sub})...`);
      if (user && account && profile) {
        const created = new User({
          ...User.fromJSON(user as UserJSON),
          id: account.id || profile.id || user.id || token.sub,
          name: profile.name || user.name || token.name || '',
          photo: profile.image || user.photo || token.picture || '',
          email: profile.email || user.email || token.email || '',
          locale: profile.locale || user.locale,
          scopes: (account.scope as string).split(' '),
          token: account.refresh_token,
        });
        const res = (await to(getUser(created.id)))[1];
        created.subscriptions = res?.subscriptions || [];
        created.label = res?.label || (await getOrCreateLabel(created));
        created.filter = res?.filter || (await getOrCreateFilter(created));
        logger.verbose(`Creating document for ${created}...`);
        await Promise.all([updateUserDoc(created), syncGmail(created)]);
      }
      // Don't include user data in the JWT because it's larger than the max
      // cookie payload size supported by most browsers (~4096 bytes).
      // @see {@link https://next-auth.js.org/faq#what-are-the-disadvantages-of-json-web-tokens}
      // @see {@link http://browsercookielimits.iain.guru/}
      console.timeEnd('process-jwt');
      return token;
    },
    async session(session, token) {
      // Instead of including user data in the JWT itself (because of cookie
      // payload size limits), I fetch that data from our database here.
      // @see {@link https://next-auth.js.org/configuration/callbacks#session-callback}
      console.time('fetch-session');
      const user = await getUser((token as { sub: string }).sub);
      logger.verbose(`Fetching session for ${user}...`);
      console.timeEnd('fetch-session');
      return { ...session, user: user.toJSON() };
    },
  },
  secret: process.env.AUTH_SECRET,
  jwt: {
    secret: process.env.AUTH_SECRET,
    signingKey:
      '{"kty":"oct","kid":"SUmM9tnlyuJA7zSaWZQ5QCvr9JOg2FcXEVHDUyRQjLA","alg":"HS512","k":"iu25tYNV3q2M1hny1LcgGKMWZCzNDowps7v8ZNDxsaFa7e7mUqG6qCnqcpOivEoJOC5SXlZXAEnxu05QtVSO9A"}',
  },
});
