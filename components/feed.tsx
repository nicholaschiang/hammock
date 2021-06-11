import { mutate, useSWRInfinite } from 'swr';
import { useCallback, useEffect, useMemo } from 'react';
import Head from 'next/head';
import InfiniteScroll from 'react-infinite-scroll-component';

import { MessagesQuery, MessagesRes } from 'pages/api/messages';

import Empty from 'components/empty';
import Section from 'components/section';

import { MessageJSON } from 'lib/model/message';
import { isSameDay } from 'lib/utils';
import useNow from 'lib/hooks/now';

interface FeedSectionProps {
  date: Date;
  messages: MessageJSON[];
}

function FeedSection({ date, messages }: FeedSectionProps): JSX.Element {
  const now = useNow();
  const header = useMemo(() => {
    if (!date) return;
    if (isSameDay(now, date)) return 'Today';
    return date.toLocaleString('en', { month: 'short', day: 'numeric' });
  }, [date, now]);
  
  return <Section header={header} messages={messages} />;
}

export default function Feed(query: MessagesQuery): JSX.Element {
  const getKey = useCallback(
    (pageIdx: number, prev: MessagesRes | null) => {
      const params = new URLSearchParams(query);
      if (prev && !prev.length) return null;
      if (!prev || pageIdx === 0) {
        const queryString = params.toString();
        return queryString ? `/api/messages?${queryString}` : '/api/messages';
      }
      params.append('lastMessageId', prev[prev.length - 1].id);
      return `/api/messages?${params.toString()}`;
    },
    [query]
  );

  const { data, setSize } = useSWRInfinite<MessagesRes>(getKey, {
    revalidateAll: true,
  });

  useEffect(() => {
    data?.flat().forEach((message) => {
      void mutate(`/api/messages/${message.id}`, message, false);
    });
  }, [data]);

  const sections = useMemo(() => {
    const newSections: FeedSectionProps[] = [];
    data?.flat().forEach((message) => {
      const createdAt = new Date(message.date);
      const existingSession = newSections.some((section) => {
        if (!isSameDay(section.date, createdAt)) return false;
        section.messages.push(message);
        return true;
      });
      if (!existingSession) 
        newSections.push({
          date: createdAt,
          messages: [message],
        });
    });
    return newSections;
  }, [data]);

  return (
    <InfiniteScroll
      dataLength={data?.flat().length || 0}
      next={() => setSize((prev) => prev + 1)}
      hasMore={!data || data[data.length - 1].length === 10}
      style={{ overflow: undefined }}
      scrollThreshold={0.65} 
      loader={<Section />}
    >
      <Head>
        <link rel='preload' href='/api/messages' as='fetch' />
      </Head>
      {!data && <Section />}
      {!data && <Section />}
      {sections.map((s) => <FeedSection key={s.date.toJSON()} {...s} />)}
      {data && !sections.length && <Empty>No messages to show</Empty>}
    </InfiniteScroll>
  );
}
