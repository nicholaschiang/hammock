import { useEffect, useMemo } from 'react';
import Router from 'next/router';

import { useUser } from 'lib/context/user';

export interface PageData {
  name: string;
  url?: string;
  login?: boolean;
}

export default function usePage({ name, url, login }: PageData): void {
  const { loggedIn } = useUser();

  // Redirect to the login page if authentication is required but missing.
  const loginURL = useMemo(
    () => (url ? `/login?href=${encodeURIComponent(url)}` : '/login'),
    [url]
  );
  useEffect(() => {
    if (login) {
      void Router.prefetch(loginURL);
    }
  }, [login, loginURL]);

  // Wait for the login URL redirect location to be populated.
  useEffect(() => {
    if (login && loggedIn === false && !loginURL.includes('undefined')) {
      void Router.replace(loginURL);
    }
  }, [login, loggedIn, loginURL]);
}
