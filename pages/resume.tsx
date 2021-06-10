import Feed from 'components/feed';
import Layout from 'components/layout';
import Page from 'components/page';

export default function ResumePage(): JSX.Element {
  return (
    <Page name='Resume' login sync>
      <Layout>
        <Feed resume='true' />
      </Layout>
    </Page>
  );
}
