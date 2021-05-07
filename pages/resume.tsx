import NavBar from 'components/nav-bar';
import Page from 'components/page';
import Feed from 'components/feed';

import usePage from 'lib/hooks/page';

export default function ResumePage(): JSX.Element {
  usePage({ name: 'Resume', login: true });

  return (
    <Page title='Resume - Return of the Newsletter'>
      <div className='page'>
        <NavBar />
        <Feed resume />
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
