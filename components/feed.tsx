import { mutate, useSWRInfinite } from 'swr';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import cn from 'classnames';

import { MessagesRes } from 'pages/api/messages';

import Button from 'components/button';
import MessageRow from 'components/message-row';

import { Message, MessageJSON } from 'lib/model/message';
import { useUser } from 'lib/context/user';

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth()
  );
}

function formatDate(date: Date): string {
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return `${monthNames[date.getMonth()]} ${date.getDate()}`;
}

interface Section {
  displayDate: string;
  date: Date;
  messages: MessageJSON[];
}

export default function Feed(): JSX.Element {
  const getKey = useCallback((pageIdx: number, prev: MessagesRes | null) => {
    if (prev && !prev.messages.length) return null;
    if (!prev || pageIdx === 0) return '/api/messages';
    return `/api/messages?pageToken=${prev.nextPageToken}`;
  }, []);

  const { data, isValidating, setSize } = useSWRInfinite<MessagesRes>(getKey);
  const { user } = useUser();

  useEffect(() => {
    (data || [])
      .map((l) => l.messages)
      .flat()
      .forEach((message) => {
        void mutate(`/api/messages/${message.id}`, message, false);
      });
  }, [data]);

  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const tick = () => setNow(new Date());
    const intervalId = window.setInterval(tick, 60 * 60 * 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const title = useMemo(() => {
    if (!user.firstName) return '';
    const hourOfDay = now.getHours();
    if (hourOfDay < 12) return `Good morning, ${user.firstName}`;
    if (hourOfDay < 18) return `Good afternoon, ${user.firstName}`;
    return `Good evening, ${user.firstName}`;
  }, [now, user.firstName]);

  const sections = useMemo(() => {
    const newSections: Section[] = [];
    (data || [])
      .map((l) => l.messages)
      .flat()
      .forEach((message) => {
        const createdAt = new Date(Number(message.internalDate));
        if (
          newSections.some((section) => {
            if (!isSameDay(section.date, createdAt)) return false;
            section.messages.push(message);
            return true;
          })
        )
          return;
        newSections.push({
          displayDate: isSameDay(now, createdAt)
            ? 'Today'
            : formatDate(createdAt),
          date: createdAt,
          messages: [message],
        });
      });
    return newSections;
  }, [now, data]);

  return (
    <div className='wrapper'>
      <div className='spacer' />
      <Head>
        <link rel='preload' href='/api/messages' as='fetch' />
      </Head>
      <header>
        <h1 className={cn('nowrap', { loading: !title })}>{title}</h1>
      </header>
      {!data && (
        <div className='section'>
          <div className='header'>
            <h2 className='nowrap date loading' />
            <div className='line' />
          </div>
          <div className='messages'>
            {Array(2)
              .fill(null)
              .map((_, idx) => (
                <MessageRow loading key={idx} />
              ))}
          </div>
        </div>
      )}
      {!data && (
        <div className='section'>
          <div className='header'>
            <h2 className='nowrap date loading' />
            <div className='line' />
          </div>
          <div className='messages'>
            {Array(5)
              .fill(null)
              .map((_, idx) => (
                <MessageRow loading key={idx} />
              ))}
          </div>
        </div>
      )}
      {sections.map((s) => (
        <div className='section' key={s.displayDate}>
          <div className='header'>
            <h2 className='date'>{s.displayDate}</h2>
            <div className='line' />
          </div>
          <div className='messages'>
            {s.messages.map((m) => (
              <MessageRow key={m.id} message={Message.fromJSON(m)} />
            ))}
          </div>
        </div>
      ))}
      <Button
        disabled={isValidating}
        onClick={() => setSize((prev) => prev + 1)}
      >
        Load more messages
      </Button>
      <style jsx>{`
        .wrapper {
          flex: 1 1 auto;
          max-width: 768px;
          width: 0;
        }

        .wrapper > :global(button) {
          width: calc(100% - 48px);
          margin: 24px;
        }

        .spacer {
          height: 96px;
          width: 100vw;
          background: var(--background);
          position: fixed;
          z-index: 2;
          left: 0;
          top: 0;
        }

        header {
          margin: 0 24px;
        }

        header > h1 {
          font-size: 48px;
          font-weight: 400;
          line-height: 64px;
          height: 64px;
          margin: -12px 0 72px;
          position: relative;
          z-index: 3;
        }

        header > h1.loading {
          border-radius: 6px;
          max-width: 500px;
        }

        .section > .header {
          background: var(--background);
          position: sticky;
          margin: 0 -24px;
          padding: 0 24px;
          z-index: 1;
          top: 90px;
        }

        .section > .header > h2.date {
          color: var(--accents-5);
          font-size: 18px;
          font-weight: 700;
          line-height: 24px;
          margin: 24px;
          height: 24px;
        }

        .section > .header > h2.date.loading {
          border-radius: 6px;
          max-width: 50px;
        }

        .section > .messages {
          padding-bottom: 48px;
        }

        .header > .line {
          border-bottom: 2px solid var(--accents-2);
          margin: 24px;
        }

        button {
          margin-top: 48px;
          width: 100%;
        }
      `}</style>
    </div>
  );
}
