import Router from 'next/router';
import { useEffect } from 'react';

import Header from 'components/header';
import Reader from 'components/reader';
import Page from 'components/page';

import { useUser } from 'lib/context/user';
import usePage from 'lib/hooks/page';

export default function IndexPage(): JSX.Element {
  usePage({ name: 'Home', login: true });

  const { user, loggedIn } = useUser();

  useEffect(() => {
    if (loggedIn && !user.onboarded) {
      void Router.replace('/onboarding');
    }
  }, [loggedIn, user.onboarded]);

  return (
    <Page title='Home - Return of the Newsletter'>
      <Header />
      <Reader />
    </Page>
  );
}
