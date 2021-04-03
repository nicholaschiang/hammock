import { createContext, useContext } from 'react';

import { User } from 'lib/model/user';

export interface UserContextValue {
  loggedIn?: boolean;
  user: User;
}

export const UserContext = createContext<UserContextValue>({
  loggedIn: undefined,
  user: new User(),
});

export const useUser = () => useContext<UserContextValue>(UserContext);
