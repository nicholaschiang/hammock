import NavBar from 'components/nav-bar';
import Page from 'components/page';
import Feed from 'components/feed';

import usePage from 'lib/hooks/page';

export default function QuickReadPage(): JSX.Element {
  usePage({ name: 'Quick Read', login: true });

  return (
    <Page title='Quick Read - Return of the Newsletter'>
      <div className='page'>
        <NavBar />
        <Feed quickRead='true' />
        <style jsx>{`
          .page {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            max-width: 1048px;
            padding: 0 48px;
            margin: 96px auto;
          }
        `}</style>
      </div>
    </Page>
  );
}
