import NavBar from 'components/nav-bar';
import Page from 'components/page';
import Feed from 'components/feed';

import usePage from 'lib/hooks/page';

export default function FeedPage(): JSX.Element {
  usePage({ name: 'Feed', login: true, sync: true });

  return (
    <Page title='Feed - Hammock'>
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
            margin: 96px auto;
          }
        `}</style>
      </div>
    </Page>
  );
}
