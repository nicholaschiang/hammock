import Router from 'next/router';
import { useEffect } from 'react';

import { useUser } from 'lib/context/user';

export interface PageData {
  name: string;
  login?: boolean;
  sync?: boolean;
}

export default function usePage({ name, login, sync }: PageData): void {
  // Scrappy fix to sync the user's Gmail with our database when they login.
  // @see {@link https://github.com/readhammock/hammock/issues/38}
  useEffect(() => {
    if (!sync) return;
    void fetch('/api/sync');
  }, [sync]);

  // Redirect to the login page if authentication is required but missing.
  const { loggedIn } = useUser();
  useEffect(() => {
    if (!login) return;
    void Router.prefetch('/login');
  }, [login]);
  useEffect(() => {
    if (!login || loggedIn || loggedIn === undefined) return;
    void Router.replace('/login');
  }, [login, loggedIn]);

  // Log the analytics page event specifying a name for easier grouping (e.g. it
  // is practically impossible to identify a page by dynamic URL alone).
  useEffect(() => {
    window.analytics?.page('', name);
  }, [name]);
}
