import NavBar from 'components/nav-bar';
import Page from 'components/page';
import Writers from 'components/writers';

export default function WritersPage(): JSX.Element {
  return (
    <Page name='Writers' login sync>
      <div className='page'>
        <NavBar />
        <Writers />
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
