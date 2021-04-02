import Page from 'components/page';
import Header from 'components/header';
import Onboarding from 'components/onboarding';

import usePage from 'lib/hooks/page';

export default function OnboardingPage(): JSX.Element {
  usePage({ name: 'Home', login: true });

  return (
    <Page title='Onboarding - Return of the Newsletter'>
      <Header />
      <Onboarding />
    </Page>
  );
}
