import NavBar from 'components/nav-bar';
import Page from 'components/page';
import Reader from 'components/reader';

import usePage from 'lib/hooks/page';

export default function IndexPage(): JSX.Element {
  usePage({ name: 'Home', login: true });

  return (
    <Page title='Home - Return of the Newsletter'>
      <div className='page'>
        <NavBar />
        <Reader />
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
