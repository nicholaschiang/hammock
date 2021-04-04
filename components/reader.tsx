import { mutate, useSWRInfinite } from 'swr';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import he from 'he';

import { MessagesRes } from 'pages/api/messages';

import Content from 'components/content';
import Divider from 'components/divider';

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
      <div className='row'>
        <div className='name'>
          <img
            className='rounded-full h-4 w-4 inline-block mr-2'
            src={message.icon}
            alt=''
          />
          {name}
        </div>
        <div className='subject'>{subject}</div>
        <div className='snippet'>{snippet}</div>
        <style jsx>{`
          .row {

        `}</style>
      </div>
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
    <Content>
      <Head>
        <link rel='preload' href='/api/messages' as='fetch' />
      </Head>
      <div className='text-5xl font-weight-500 pb-2'>{title}</div>
      {sections.map((s) => (
        <div className='pt-3 pb-8' key={s.displayDate}>
          <p className='text-lg text-gray-500 pb-1'>{s.displayDate}</p>
          <Divider />
          {s.messages.map((m) => (
            <EmailRow key={m.id} message={Message.fromJSON(m)} />
          ))}
        </div>
      ))}
      <div
        className='text-sm text-gray-600 pb-4 cursor-pointer'
        onClick={() => setSize((prev) => prev + 1)}
      >
        Load More
      </div>
    </Content>
  );
}
