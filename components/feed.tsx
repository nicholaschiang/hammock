import Head from 'next/head';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useMemo } from 'react';

import Empty from 'components/empty';
import Section from 'components/section';

import { Message } from 'lib/model/message';
import { MessagesQuery } from 'lib/model/query';
import { isSameDay } from 'lib/utils';
import useFetch from 'lib/hooks/fetch';
import useNow from 'lib/hooks/now';

interface FeedSectionProps {
  date: Date;
  messages: Message[];
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
  const { data, setSize, hasMore, href } = useFetch<Message>(
    'message',
    '/api/messages',
    query
  );
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

  // TODO: Ensure that there aren't duplicate keys in the infinite scroller due
  // to local mutations and revalidations for only certain message pages.
  return (
    <InfiniteScroll
      dataLength={data?.flat().length || 0}
      next={() => setSize((prev) => prev + 1)}
      hasMore={hasMore}
      style={{ overflow: undefined }}
      scrollThreshold={0.65}
      loader={<Section />}
    >
      <Head>
        <link
          rel='preload'
          href={href}
          crossOrigin='anonymous'
          type='application/json'
          as='fetch'
        />
      </Head>
      {!data && <Section />}
      {!data && <Section />}
      {sections.map((s) => (
        <FeedSection key={s.date.toJSON()} {...s} />
      ))}
      {data && !sections.length && (
        <Empty>You’re all caught up with your reading!</Empty>
      )}
    </InfiniteScroll>
  );
}
