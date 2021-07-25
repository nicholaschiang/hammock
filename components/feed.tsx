import { useEffect, useMemo } from 'react';
import Head from 'next/head';
import InfiniteScroll from 'react-infinite-scroll-component';
import { mutate } from 'swr';

import { MessagesQuery } from 'pages/api/messages';

import Empty from 'components/empty';
import Section from 'components/section';

import { MessageJSON } from 'lib/model/message';
import { isSameDay } from 'lib/utils';
import useMessages from 'lib/hooks/messages';
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
  const { data, setSize } = useMessages(query);

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
        <link
          rel='preload'
          href='/api/messages'
          as='fetch'
          crossOrigin='anonymous'
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
