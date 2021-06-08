import NavBar from 'components/nav-bar';
import Page from 'components/page';
import Feed from 'components/feed';

export default function QuickReadPage(): JSX.Element {
  return (
    <Page name='Quick Read' login sync>
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
