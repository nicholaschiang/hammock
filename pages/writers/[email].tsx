import Router, { useRouter } from 'next/router';
import { useEffect, useMemo } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';

import Empty from 'components/empty';
import Layout from 'components/layout';
import MessageRow from 'components/message-row';
import Page from 'components/page';
import Section from 'components/section';

import { HITS_PER_PAGE } from 'lib/model/query';
import useMessages from 'lib/hooks/messages';
import { useUser } from 'lib/context/user';

export default function WritersPage(): JSX.Element {
  const { query } = useRouter();
  const { user, loggedIn } = useUser();
  const { data, setSize } = useMessages({ writer: query.email as string });
  const writer = useMemo(
    () => user?.subscriptions.find((s) => s.email === query.email),
    [query.email, user?.subscriptions]
  );

  useEffect(() => {
    if (!loggedIn || writer) return;
    void Router.push('/404');
  }, [loggedIn, writer]);

  const loader = useMemo(() => {
    const empty = Array(3).fill(null);
    // eslint-disable-next-line react/no-array-index-key
    return empty.map((_, idx) => <MessageRow key={idx} loading />);
  }, []);

  return (
    <Page name='Writers' login sync>
      <Layout spacer>
        <InfiniteScroll
          dataLength={data?.flat().length || 0}
          next={() => setSize((prev) => prev + 1)}
          hasMore={!data || data[data.length - 1].length === HITS_PER_PAGE}
          style={{ overflow: undefined }}
          scrollThreshold={0.65}
          loader={loader}
        >
          {!loggedIn && <Section />}
          {loggedIn && (
            <Section header={writer?.name} messages={data?.flat()} date />
          )}
          {loggedIn && data && !data?.flat().length && (
            <Empty>You’re all caught up with your reading!</Empty>
          )}
        </InfiniteScroll>
      </Layout>
    </Page>
  );
}
