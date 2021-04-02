import Header from 'components/header';
import Reader from 'components/reader';
import Page from 'components/page';

import usePage from 'lib/hooks/page';

export default function IndexPage(): JSX.Element {
  usePage({ name: 'Home', login: true });

  return (
    <Page title='Home - Return of the Newsletter'>
      <Header />
      <Reader />
    </Page>
  );
}
