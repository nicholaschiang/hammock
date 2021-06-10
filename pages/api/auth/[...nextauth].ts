import NextAuth from 'next-auth';
import Providers from 'next-auth/providers';
import to from 'await-to-js';

import { User, UserJSON } from 'lib/model/user';
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
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth?prompt=consent&access_type=offline&response_type=code',
      scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/gmail.settings.basic',
        'https://www.googleapis.com/auth/gmail.labels',
      ].join(' '),
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
      logger.verbose(`Processing JWT for user (${token.sub})...`);
      if (user && account && profile) {
        const created = new User({
          ...User.fromJSON(user as UserJSON),
          id: account.id || profile.id || user.id || token.sub,
          name: profile.name || user.name || token.name || '',
          photo: profile.image || user.photo || token.picture || '',
          email: profile.email || user.email || token.email || '',
          locale: profile.locale || user.locale,
          token: account.refresh_token,
        });
        const [_, res] = await to(getUser(created.id));
        created.subscriptions = res?.subscriptions || [];
        created.label = res?.label || await getOrCreateLabel(created);
        created.filter = res?.filter || await getOrCreateFilter(created);
        logger.verbose(`Creating document for ${created}...`);
        await Promise.all([updateUserDoc(created), syncGmail(created)]);
        return { ...token, ...created };
      }
      const existing = await getUser(token.sub || '');
      return { ...token, ...existing };
    },
    session(session, token) {
      const user = User.fromJSON(token as UserJSON);
      logger.verbose(`Fetching session for ${user}...`);
      return { ...session, user: user.toJSON() };
    },
  },
  secret: process.env.AUTH_SECRET,
  jwt: {
    secret: process.env.AUTH_SECRET,
    signingKey: '{"kty":"oct","kid":"SUmM9tnlyuJA7zSaWZQ5QCvr9JOg2FcXEVHDUyRQjLA","alg":"HS512","k":"iu25tYNV3q2M1hny1LcgGKMWZCzNDowps7v8ZNDxsaFa7e7mUqG6qCnqcpOivEoJOC5SXlZXAEnxu05QtVSO9A"}',
  },
});
