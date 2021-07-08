import Feed from 'components/feed';
import Layout from 'components/layout';
import Page from 'components/page';

export default function QuickReadPage(): JSX.Element {
  return (
    <Page name='Quick Read' login sync>
      <Layout spacer>
        <Feed quickRead='true' />
      </Layout>
    </Page>
  );
}
