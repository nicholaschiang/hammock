import Letters from 'components/letters';
import Page from 'components/page';

import usePage from 'lib/hooks/page';

export default function LettersPage(): JSX.Element {
  usePage({ name: 'Home', login: true });

  return (
    <Page title='Letters - Return of the Newsletter'>
      <Letters />
    </Page>
  );
}
