import Letters from 'components/letters';
import NavBar from 'components/nav-bar';
import Page from 'components/page';

import usePage from 'lib/hooks/page';

export default function LettersPage(): JSX.Element {
  usePage({ name: 'Home', login: true });

  return (
    <Page title='Letters - Return of the Newsletter'>
      <div className='page'>
        <NavBar />
        <Letters />
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
