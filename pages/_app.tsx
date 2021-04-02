import { useEffect, useCallback, useRef, useMemo } from 'react';
import useSWR, { SWRConfig, mutate } from 'swr';
import { AppProps } from 'next/app';

import NProgress from 'components/nprogress';

import { User, UserJSON } from 'lib/model/user';
import { APIError } from 'lib/api/error';
import { CallbackParam } from 'lib/model/callback';
import { UserContext } from 'lib/context/user';
import { fetcher } from 'lib/fetch';

import 'styles/globals.css';
import 'styles/nprogress.css';

// Installs a service worker and triggers an `/api/account` re-validation once
// the service worker has been activated and is control of this page (i.e. once
// the service worker can intercept our fetch requests and append the auth JWT).
// @see {@link https://bit.ly/3gnChWt}
async function installServiceWorker(): Promise<void> {
  if ('serviceWorker' in navigator) {
    await navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg: ServiceWorkerRegistration) => {
        reg.addEventListener('updatefound', () => {
          const worker = reg.installing as ServiceWorker;
          worker.addEventListener('statechange', () => {
            if (worker.state === 'activated') {
              void mutate('/api/account');
            }
          });
        });
      });
  } else {
    console.error('Service workers are disabled. Authentication will fail.');
  }
}

export default function App({ Component, pageProps }: AppProps): JSX.Element {
  const { data, error } = useSWR<UserJSON, APIError>('/api/account', fetcher);
  const user = useMemo(() => (data ? User.fromJSON(data) : new User()), [data]);
  const userLoaded = useRef<boolean>(false);
  const loggedIn = useMemo(() => {
    if (user.id) {
      userLoaded.current = true;
      return true;
    }
    if (error) {
      userLoaded.current = true;
      return false;
    }
    if (!userLoaded.current) return undefined;
    return false;
  }, [user, error]);
  const setUser = useCallback(
    (param: CallbackParam<User>) => {
      let updated: User = user;
      if (typeof param === 'object') updated = new User(param);
      if (typeof param === 'function') updated = new User(param(user));
      return mutate('/api/account', updated.toJSON(), loggedIn === undefined);
    },
    [user, loggedIn]
  );

  // This service worker appends the Firebase Authentication JWT to all of our
  // same-origin fetch requests. In the future, it'll handle caching as well.
  useEffect(() => {
    void installServiceWorker();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, loggedIn }}>
      <SWRConfig value={{ fetcher }}>
        <NProgress />
        <Component {...pageProps} />
      </SWRConfig>
    </UserContext.Provider>
  );
}
