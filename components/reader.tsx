import { mutate, useSWRInfinite } from 'swr';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import cn from 'classnames';
import he from 'he';

import { MessagesRes } from 'pages/api/messages';

import Avatar from 'components/avatar';
import Button from 'components/button';

import { Message, MessageJSON } from 'lib/model/message';
import { parseFrom } from 'lib/utils';
import { useUser } from 'lib/context/user';

interface EmailRowProps {
  message?: Message;
  loading?: boolean;
}

function EmailRow({ message, loading }: EmailRowProps): JSX.Element {
  const from = message?.getHeader('from');
  const subject = message?.getHeader('subject');
  const { name } = parseFrom(from || '');

  const snippet = useMemo(() => {
    if (!message?.snippet) return '';
    let cleanedUp: string = he.decode(message.snippet);
    if (!cleanedUp.endsWith('.')) cleanedUp += '...';
    return cleanedUp;
  }, [message?.snippet]);

  return (
    <Link href={message ? `/messages/${message.id}` : ''}>
      <a className={cn('row', { disabled: loading })}>
        <div className='header'>
          <Avatar src={message?.icon} loading={loading} size={24} />
          <span className={cn('name', { loading })}>{name}</span>
        </div>
        <div className={cn('subject', { loading })}>{subject}</div>
        <div className={cn('snippet', { loading })}>{snippet}</div>
        <style jsx>{`
          .row {
            display: block;
            text-decoration: none;
            transition: box-shadow 0.2s ease 0s;
            padding: 12px 24px;
            border-radius: 8px;
            margin: 0;
          }

          .row.disabled {
            cursor: wait;
          }

          .row:hover {
            box-shadow: var(--shadow-medium);
          }

          .row > div {
            margin: 8px 0;
          }

          .header,
          .subject {
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
          }

          .header {
            display: flex;
            height: 24px;
          }

          .header > span.name {
            font-size: 14px;
            font-weight: 400;
            line-height: 24px;
            color: var(--accents-5);
          }

          .header > span.name.loading {
            width: 100px;
          }

          .header > :global(div) {
            margin-right: 8px;
          }

          .subject {
            font-size: 18px;
            font-weight: 700;
            line-height: 24px;
            height: 24px;
            color: var(--accents-6);
          }

          .subject.loading,
          .snippet.loading,
          .name.loading {
            border-radius: 6px;
          }

          .snippet {
            font-size: 16px;
            font-weight: 400;
            line-height: 24px;
            color: var(--accents-6);
          }

          .snippet.loading {
            height: 72px;
          }
        `}</style>
      </a>
    </Link>
  );
}

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

export default function Reader(): JSX.Element {
  const getKey = useCallback((pageIdx: number, prev: MessagesRes | null) => {
    if (prev && !prev.messages.length) return null;
    if (!prev || pageIdx === 0) return '/api/messages';
    return `/api/messages?pageToken=${prev.nextPageToken}`;
  }, []);

  const { data, setSize } = useSWRInfinite<MessagesRes>(getKey);
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
      <Head>
        <link rel='preload' href='/api/messages' as='fetch' />
      </Head>
      <header>
        <h1 className={cn({ loading: !title })}>{title}</h1>
      </header>
      {!data && (
        <div className='section'>
          <h2 className='date loading' />
          <div className='line' />
          {Array(2)
            .fill(null)
            .map((_, idx) => (
              <EmailRow loading key={idx} />
            ))}
        </div>
      )}
      {!data && (
        <div className='section'>
          <h2 className='date loading' />
          <div className='line' />
          {Array(5)
            .fill(null)
            .map((_, idx) => (
              <EmailRow loading key={idx} />
            ))}
        </div>
      )}
      {sections.map((s) => (
        <div className='section' key={s.displayDate}>
          <h2 className='date'>{s.displayDate}</h2>
          <div className='line' />
          {s.messages.map((m) => (
            <EmailRow key={m.id} message={Message.fromJSON(m)} />
          ))}
        </div>
      ))}
      <Button disabled={!data} onClick={() => setSize((prev) => prev + 1)}>
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

        header {
          margin: 0 24px;
        }

        header > h1 {
          font-size: 48px;
          font-weight: 400;
          line-height: 64px;
          height: 64px;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          margin: 0 0 -24px;
        }

        header > h1.loading {
          border-radius: 6px;
          max-width: 500px;
        }

        .section > h2.date {
          color: var(--accents-5);
          font-size: 18px;
          font-weight: 700;
          line-height: 24px;
          height: 24px;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          margin: 72px 24px 24px;
        }

        .section > h2.date.loading {
          border-radius: 6px;
          max-width: 50px;
        }

        .line {
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
