import { configureScope, setUser as setSentryUser } from '@sentry/nextjs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useSWR, { SWRConfig, mutate } from 'swr';
import { AppProps } from 'next/app';
import { dequal } from 'dequal';

import NProgress from 'components/nprogress';
import Segment from 'components/segment';

import { Mutated, MutatedContext } from 'lib/hooks/fetch';
import { Theme, ThemeContext } from 'lib/context/theme';
import { APIError } from 'lib/model/error';
import { CallbackParam } from 'lib/model/callback';
import { User } from 'lib/model/user';
import { UserContext } from 'lib/context/user';
import { fetcher } from 'lib/fetch';

import 'fonts.css';

const light = `
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI',
    'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans',
    'Droid Sans', 'Helvetica Neue', sans-serif;
  --font-mono: Menlo, Monaco, Lucida Console, Liberation Mono,
    DejaVu Sans Mono, Bitstream Vera Sans Mono, Courier New, monospace;

  --primary: #0070f3;
  --on-primary: #fff;
  --background: #fff;
  --on-background: #000;
  --error: #b00020;
  --on-error: #fff;
  --warning: #f5a623;

  --accents-1: #fafafa;
  --accents-2: #eaeaea;
  --accents-3: #999;
  --accents-4: #888;
  --accents-5: #666;
  --accents-6: #444;

  --shadow-small: 0 5px 10px rgba(0, 0, 0, 0.12);
  --shadow-medium: 0 8px 30px rgba(0, 0, 0, 0.12);
  --shadow-large: 0 30px 60px rgba(0, 0, 0, 0.12);

  --selection: #0c5eb1;
  --on-selection: #dfeef6;

  --highlight: #fefbbe;
  --highlight-hover: #fef772;
  --on-highlight: #444;
`;

const dark = `
  --primary: #5aa6ff;
  --on-primary: #000;
  --background: #303030;
  --on-background: #e4e4e4; /* rgba(255,255,255,0.87) on #303030 bg */
  --error: #cf6679;
  --on-error: #000;

  /* Convert rgba colors to hex codes with borderleft.com/toolbox/rgba */
  --accents-1: #323232; /* rgba(255,255,255,0.01) on #303030 bg */
  --accents-2: #454545; /* rgba(255,255,255,0.1) on #303030 bg */
  --accents-3: #595959; /* rgba(255,255,255,0.2) on #303030 bg */
  --accents-4: #838383; /* rgba(255,255,255,0.4) on #303030 bg */
  --accents-5: #acacac; /* rgba(255,255,255,0.6) on #303030 bg */
  --accents-6: #e4e4e4; /* rgba(255,255,255,0.87) on #303030 bg */

  --shadow-small: 0 0 0 1px var(--accents-2);
  --shadow-medium: 0 0 0 1px var(--accents-2);
  --shadow-large: 0 0 0 1px var(--accents-2);
`;

export default function App({ Component, pageProps }: AppProps): JSX.Element {
  const [userMutated, setUserMutated] = useState<boolean>(false);
  const { data: user, error } = useSWR<User, APIError>(
    '/api/account',
    fetcher,
    {
      isPaused: () => userMutated,
    }
  );
  const userLoaded = useRef<boolean>(false);
  const loggedIn = useMemo(() => {
    if (user?.id) {
      userLoaded.current = true;
      return true;
    }
    if (error) {
      userLoaded.current = true;
      return false;
    }
    return userLoaded.current ? false : undefined;
  }, [user, error]);
  const setUser = useCallback(
    (param: CallbackParam<User | undefined>) => {
      let updated = user;
      if (typeof param === 'function') updated = param(updated);
      if (typeof param === 'object') updated = param;
      if (!dequal(updated, user)) setUserMutated(true);
      // Trigger revalidation if we haven't received any account data yet.
      // @see {@link https://github.com/readhammock/hammock/issues/33}
      void mutate('/api/account', updated, loggedIn === undefined);
    },
    [loggedIn, user]
  );
  useEffect(() => {
    if (!user?.id) {
      configureScope((scope) => scope.setUser(null));
    } else {
      setSentryUser({
        id: user.id.toString(),
        username: user.name,
        email: user.email || undefined,
      });
    }
  }, [user]);

  const [theme, setTheme] = useState<Theme>('system');
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.documentElement.classList.remove('system');
    } else if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.remove('system');
    } else {
      document.documentElement.classList.add('system');
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.remove('light');
    }
  }, [theme]);
  useEffect(() => {
    setTheme((prev) => (localStorage.getItem('theme') as Theme) || prev);
  }, []);
  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  const [mutated, setMutated] = useState<Mutated>({
    highlight: false,
    message: false,
    account: false,
  });

  return (
    <UserContext.Provider value={{ user, setUser, setUserMutated, loggedIn }}>
      <ThemeContext.Provider value={{ theme, setTheme }}>
        <SWRConfig value={{ fetcher }}>
          <Segment />
          <NProgress />
          <MutatedContext.Provider value={{ mutated, setMutated }}>
            <Component {...pageProps} />
          </MutatedContext.Provider>
        </SWRConfig>
        <style jsx global>{`
          ::selection {
            background-color: var(--selection);
            color: var(--on-selection);
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
            font-feature-settings: 'kern';
          }

          body {
            position: relative;
            min-height: 100%;
            margin: 0;
          }

          html,
          body {
            font-size: 16px;
            line-height: 1.65;
            font-family: var(--font-sans);
            text-rendering: optimizeLegibility;
            -webkit-font-smoothing: subpixel-antialiased;
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
            cursor: wait;
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
            ${light}
          }
          @media (prefers-color-scheme: light) {
            :root {
              ${light}
            }
          }
          @media (prefers-color-scheme: dark) {
            :root {
              ${dark}
            }
          }
          .light {
            ${light}
          }
          .dark {
            ${dark}
          }
        `}</style>
      </ThemeContext.Provider>
    </UserContext.Provider>
  );
}
