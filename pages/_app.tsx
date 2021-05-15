import { useCallback, useMemo, useRef, useState } from 'react';
import useSWR, { SWRConfig, mutate } from 'swr';
import { AppProps } from 'next/app';
import { dequal } from 'dequal';

import NProgress from 'components/nprogress';
import Segment from 'components/segment';

import { User, UserJSON } from 'lib/model/user';
import { APIError } from 'lib/model/error';
import { CallbackParam } from 'lib/model/callback';
import { UserContext } from 'lib/context/user';
import { fetcher } from 'lib/fetch';

export default function App({ Component, pageProps }: AppProps): JSX.Element {
  const [userMutated, setUserMutated] = useState<boolean>(false);
  const { data, error } = useSWR<UserJSON, APIError>('/api/account', fetcher, {
    isPaused: () => userMutated,
  });
  const user = useMemo(() => (data ? User.fromJSON(data) : new User()), [data]);
  const setUser = useCallback(
    (param: CallbackParam<User>) => {
      let updated = user;
      if (typeof param === 'function') updated = param(updated);
      if (typeof param === 'object') updated = param;
      if (!dequal(updated, user)) setUserMutated(true);
      void mutate('/api/account', updated.toJSON(), false);
    },
    [user]
  );
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

  return (
    <UserContext.Provider value={{ user, setUser, setUserMutated, loggedIn }}>
      <SWRConfig value={{ fetcher }}>
        <Segment />
        <NProgress />
        <Component {...pageProps} />
      </SWRConfig>
      <style jsx global>{`
        ::selection {
          background-color: var(--selection);
          color: var(--on-background);
        }

        *,
        *:before,
        *:after {
          box-sizing: inherit;
        }

        html {
          height: 100%;
          box-sizing: border-box;
          touch-action: manipulation;
          font-feature-settings: 'rlig' 1, 'calt' 0;
        }

        body {
          position: relative;
          min-height: 100%;
          margin: 0;
        }

        html,
        body {
          font-family: var(--font-sans);
          text-rendering: optimizeLegibility;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          background-color: var(--background);
          color: var(--on-background);
        }

        button.reset {
          border: unset;
          background: unset;
          padding: unset;
          margin: unset;
          font: unset;
          text-align: unset;
          appearance: unset;
          cursor: pointer;
        }

        .nowrap {
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .loading {
          background-image: linear-gradient(
            270deg,
            var(--accents-1),
            var(--accents-2),
            var(--accents-2),
            var(--accents-1)
          );
          background-size: 400% 100%;
          -webkit-animation: loadingAnimation 8s ease-in-out infinite;
          animation: loadingAnimation 8s ease-in-out infinite;
        }

        @keyframes loadingAnimation {
          0% {
            background-position: 200% 0;
          }
          to {
            background-position: -200% 0;
          }
        }
      `}</style>
      <style jsx global>{`
        :root {
          --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI',
            'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans',
            'Helvetica Neue', sans-serif;
          --font-mono: Menlo, Monaco, Lucida Console, Liberation Mono,
            DejaVu Sans Mono, Bitstream Vera Sans Mono, Courier New, monospace;

          --primary: #0070f3;
          --on-primary: #fff;
          --background: #fff;
          --on-background: #000;
          --error: #b00020;
          --on-error: #fff;

          --accents-1: #fafafa;
          --accents-2: #eaeaea;
          --accents-3: #999;
          --accents-4: #888;
          --accents-5: #666;
          --accents-6: #444;

          --shadow-small: 0 5px 10px rgba(0, 0, 0, 0.12);
          --shadow-medium: 0 8px 30px rgba(0, 0, 0, 0.12);
          --shadow-large: 0 30px 60px rgba(0, 0, 0, 0.12);

          --selection: #79ffe1;
        }

        .dark {
          --primary: #5aa6ff;
          --on-primary: #000;
          --background: #000;
          --on-background: #fff;
          --error: #cf6679;
          --on-error: #000;

          --accents-1: #111;
          --accents-2: #333;
          --accents-3: #444;
          --accents-4: #666;
          --accents-5: #888;
          --accents-6: #999;

          --shadow-small: 0 0 0 1px var(--accents-2);
          --shadow-medium: 0 0 0 1px var(--accents-2);
          --shadow-large: 0 0 0 1px var(--accents-2);

          --selection: #f81ce5;
        }
      `}</style>
    </UserContext.Provider>
  );
}
