import NavBar from 'components/nav-bar';
import Page from 'components/page';
import Feed from 'components/feed';

import usePage from 'lib/hooks/page';

export default function IndexPage(): JSX.Element {
  usePage({ name: 'Home', login: true });

  return (
    <Page title='Home - Return of the Newsletter'>
      <div className='page'>
        <NavBar />
        <Feed />
        <style jsx>{`
          .page {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            max-width: 1048px;
            padding: 0 48px;
            margin: 72px auto;
          }
        `}</style>
      </div>
    </Page>
  );
}
