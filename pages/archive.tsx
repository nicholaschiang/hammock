import Feed from 'components/feed';
import Layout from 'components/layout';
import Page from 'components/page';

export default function ArchivePage(): JSX.Element {
  return (
    <Page name='Archive' login sync>
      <Layout spacer>
        <Feed archive='true' />
      </Layout>
    </Page>
  );
}
