import NextAuth from 'next-auth';

import { UserJSON } from 'lib/model/user';

declare module 'next-auth' {
  /**
   * @typedef {Object} User
   * @description
   * The shape of the user object returned in the OAuth providers' `profile` 
   * callback, or the 2nd parameter of the `session` callback, when using a db.
   * @see {@link https://next-auth.js.org/getting-started/typescript}
   */
  interface User extends UserJSON {};
  interface JWT extends UserJSON {};
 
  /**
   * @typedef {Object} Session
   * @description
   * Returned by `useSession`, `getSession` and received as a prop on the 
   * `Provider` React Context.
   * @see {@link https://next-auth.js.org/getting-started/typescript}
   */
  interface Session extends NextAuth.Session {
    user: UserJSON;
  }

  /** 
   * @typedef {Object} Profile
   * @description
   * The OAuth profile returned from your provider.
   * @see {@link https://next-auth.js.org/getting-started/typescript}
   */
  interface Profile {
    id: string;
    email: string;
    verified_email: boolean;
    name: string;
    given_name: string;
    family_name: string;
    picture: string;
    locale: string;
  }
}
