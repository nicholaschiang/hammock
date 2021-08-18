import { createContext, useContext } from 'react';

import { Callback } from 'lib/model/callback';
import { User } from 'lib/model/user';

export interface UserContextValue {
  user?: User;
  setUser: Callback<User | undefined>;
  setUserMutated: Callback<boolean>;
  loggedIn?: boolean;
}

export const UserContext = createContext<UserContextValue>({
  user: undefined,
  setUser: () => {},
  setUserMutated: () => {},
  loggedIn: undefined,
});

export const useUser = () => useContext<UserContextValue>(UserContext);
