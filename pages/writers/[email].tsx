import Router, { useRouter } from 'next/router';
import { mutate, useSWRInfinite } from 'swr';
import { useCallback, useEffect, useMemo } from 'react';

import { MessagesRes } from 'pages/api/messages';

import Button from 'components/button';
import Layout from 'components/layout';
import Page from 'components/page';
import Section from 'components/section';

import { useUser } from 'lib/context/user';

export default function WritersPage(): JSX.Element {
  const { query } = useRouter();
  const { user, loggedIn } = useUser();
  const writer = useMemo(() => user.subscriptions.find((s) => s.from.email === query.email), [query.email, user.subscriptions]);
  
  useEffect(() => {
    if (!loggedIn || writer) return;
    void Router.push('/404');
  }, [loggedIn, writer]);
  
  const getKey = useCallback(
    (pageIdx: number, prev: MessagesRes | null) => {
      if (typeof query.email !== 'string') return null;
      if (prev && !prev.length) return null;
      const params = new URLSearchParams({ writer: query.email });
      if (!prev || pageIdx === 0) {
        const queryString = params.toString();
        return queryString ? `/api/messages?${queryString}` : '/api/messages';
      }
      params.append('lastMessageId', prev[prev.length - 1].id);
      return `/api/messages?${params.toString()}`;
    },
    [query.email]
  );

  const { data, isValidating, setSize } = useSWRInfinite<MessagesRes>(getKey, {
    revalidateAll: true,
  });

  useEffect(() => {
    data?.flat().forEach((message) => {
      void mutate(`/api/messages/${message.id}`, message, false);
    });
  }, [data]);

  return (
    <Page name='Writers' login sync>
      <Layout>
        {!loggedIn && <Section />}
        {loggedIn && (
          <Section header={writer?.from.name} messages={data?.flat()} date />
        )}
        <Button
          disabled={isValidating}
          onClick={() => setSize((prev) => prev + 1)}
        >
          Load more messages
        </Button>
      </Layout>
    </Page>
  );
}
