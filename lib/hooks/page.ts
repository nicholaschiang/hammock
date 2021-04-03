import { useEffect } from 'react';
import Router from 'next/router';

import { useUser } from 'lib/context/user';

export interface PageData {
  name: string;
  login?: boolean;
}

export default function usePage({ name, login }: PageData): void {
  const { loggedIn } = useUser();
  useEffect(() => {
    if (!login) return;
    void Router.prefetch('/login');
  }, [login]);
  useEffect(() => {
    if (!login || loggedIn || loggedIn === undefined) return;
    void Router.replace('/login');
  }, [login, loggedIn]);
}
