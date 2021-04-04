import { useEffect, useMemo, useRef } from 'react';
import useSWR, { SWRConfig, mutate } from 'swr';
import { AppProps } from 'next/app';

import NProgress from 'components/nprogress';

import { User, UserJSON } from 'lib/model/user';
import { APIError } from 'lib/model/error';
import { UserContext } from 'lib/context/user';
import { fetcher } from 'lib/fetch';

import config from 'styles/config';
import globals from 'styles/globals';
import theme from 'styles/theme';

/**
 * Installs a service worker and triggers an `/api/account` re-validation once
 * the service worker has been activated and is control of this page (i.e. once
 * the service worker can intercept our fetch requests and append the auth JWT).
 * @see {@link https://bit.ly/3gnChWt}
 */
async function installServiceWorker(): Promise<void> {
  if ('serviceWorker' in navigator) {
    await navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg: ServiceWorkerRegistration) =>
        reg.addEventListener('updatefound', () => {
          const worker = reg.installing as ServiceWorker;
          worker.addEventListener('statechange', () => {
            if (worker.state === 'activated') {
              void mutate('/api/account');
            }
          });
        })
      );
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
    return userLoaded.current ? false : undefined;
  }, [user, error]);

  useEffect(() => {
    void installServiceWorker();
  }, []);

  return (
    <UserContext.Provider value={{ user, loggedIn }}>
      <SWRConfig value={{ fetcher }}>
        <NProgress />
        <Component {...pageProps} />
      </SWRConfig>
      <style jsx global>
        {globals}
      </style>
      <style jsx global>
        {config}
      </style>
      <style jsx global>
        {theme}
      </style>
    </UserContext.Provider>
  );
}
