import { mutate, useSWRInfinite } from 'swr';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import he from 'he';

import { MessagesRes } from 'pages/api/messages';

import Avatar from 'components/avatar';

import { Message, MessageJSON } from 'lib/model/message';
import { parseFrom } from 'lib/utils';
import { useUser } from 'lib/context/user';

interface EmailRowProps {
  message: Message;
}

function EmailRow({ message }: EmailRowProps): JSX.Element {
  const from = message.getHeader('from');
  const subject = message.getHeader('subject');
  const { name } = parseFrom(from || '');

  const snippet = useMemo(() => {
    let cleanedUp: string = he.decode(message.snippet);
    if (!cleanedUp.endsWith('.')) cleanedUp += '...';
    return cleanedUp;
  }, [message.snippet]);

  return (
    <Link href={`/messages/${message.id}`}>
      <a className='row'>
        <div className='header'>
          <Avatar src={message.icon} size={24} />
          <span className='name'>{name}</span>
        </div>
        <div className='subject'>{subject}</div>
        <div className='snippet'>{snippet}</div>
        <style jsx>{`
          .row {
            display: block;
            text-decoration: none;
            transition: box-shadow 0.2s ease 0s;
            padding: 12px 24px;
            border-radius: 8px;
            margin: 0;
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

          .snippet {
            font-size: 16px;
            font-weight: 400;
            line-height: 24px;
            color: var(--accents-6);
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
        <h1>{title}</h1>
      </header>
      {sections.map((s) => (
        <div className='section' key={s.displayDate}>
          <h2 className='date'>{s.displayDate}</h2>
          <div className='line' />
          {s.messages.map((m) => (
            <EmailRow key={m.id} message={Message.fromJSON(m)} />
          ))}
        </div>
      ))}
      <button onClick={() => setSize((prev) => prev + 1)} type='button'>
        Load More
      </button>
      <style jsx>{`
        .wrapper {
          flex: 1 1 auto;
          max-width: 768px;
          width: 0;
        }

        header {
          margin: 0 24px;
        }

        header > h1 {
          font-size: 48px;
          font-weight: 400;
          line-height: 48px;
          margin: 0 0 -24px;
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
