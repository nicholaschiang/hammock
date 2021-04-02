import Page from 'components/page';
import Header from 'components/header';
import Letters from 'components/letters';

import usePage from 'lib/hooks/page';

export default function LettersPage(): JSX.Element {
  usePage({ name: 'Home', login: true });

  return (
    <Page title='Letters - Return of the Newsletter'>
      <Header />
      <Letters />
    </Page>
  );
}
