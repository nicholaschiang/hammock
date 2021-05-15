import { createContext, useContext } from 'react';

import { Callback, CallbackParam } from 'lib/model/callback';
import { User } from 'lib/model/user';

export interface UserContextValue {
  user: User;
  setUser: Callback<User>;
  setUserMutated: Callback<boolean>;
  loggedIn?: boolean;
}

export const UserContext = createContext<UserContextValue>({
  user: new User(),
  setUser: (param: CallbackParam<User>) => {},
  setUserMutated: (param: CallbackParam<boolean>) => {},
  loggedIn: undefined,
});

export const useUser = () => useContext<UserContextValue>(UserContext);
