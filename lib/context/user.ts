import { createContext, useContext } from 'react';

import { Callback } from 'lib/model/callback';
import { User } from 'lib/model/user';

export interface UserContextValue {
  user: User;
  setUser: Callback<User>;
  setUserMutated: Callback<boolean>;
  loggedIn?: boolean;
}

export const UserContext = createContext<UserContextValue>({
  user: new User(),
  setUser: () => {},
  setUserMutated: () => {},
  loggedIn: undefined,
});

export const useUser = () => useContext<UserContextValue>(UserContext);
