import { createContext, useContext } from 'react';

import { CallbackParam } from 'lib/model/callback';
import { User } from 'lib/model/user';

export interface UserContextValue {
  setUser: (param: CallbackParam<User>) => Promise<void>;
  loggedIn?: boolean;
  user: User;
}

export const UserContext = createContext<UserContextValue>({
  setUser: async (param: CallbackParam<User>) => {},
  loggedIn: undefined,
  user: new User(),
});

export const useUser = () => useContext<UserContextValue>(UserContext);
