import Feed from 'components/feed';
import Layout from 'components/layout';
import Page from 'components/page';

export default function FeedPage(): JSX.Element {
  return (
    <Page name='Feed' login sync>
      <Layout>
        <Feed resume='true' />
      </Layout>
    </Page>
  );
}
