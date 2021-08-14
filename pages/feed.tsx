import { useEffect } from 'react';

import Feed from 'components/feed';
import Layout from 'components/layout';
import Page from 'components/page';

export default function FeedPage(): JSX.Element {
  useEffect(() => {
    throw new Error('This is a fake production client-side error!');
  }, []);

  return (
    <Page name='Feed' login sync>
      <Layout spacer>
        <Feed />
      </Layout>
    </Page>
  );
}
