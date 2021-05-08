import Empty from 'components/empty';
import NavBar from 'components/nav-bar';
import Page from 'components/page';

import usePage from 'lib/hooks/page';

export default function HighlightsPage(): JSX.Element {
  usePage({ name: 'Highlights', login: true });

  return (
    <Page title='Highlights - Return of the Newsletter'>
      <div className='page'>
        <NavBar />
        <Empty>Coming soon</Empty>
        <style jsx>{`
          .page {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            max-width: 1048px;
            padding: 0 48px;
            margin: 96px auto;
          }

          .page :global(.empty) {
            flex: 1 1 auto;
            max-width: 768px;
            height: 500px;
            width: 0;
          }
        `}</style>
      </div>
    </Page>
  );
}
