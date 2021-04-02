import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import he from 'he';

import Content from 'components/content';
import Divider from 'components/divider';

import { Message, MessageJSON } from 'lib/model/message';
import { parseFrom } from 'lib/utils';
import { APIError } from 'lib/model/error';
import { useUser } from 'lib/context/user';

interface EmailRowProps {
  message: Message;
}

function EmailRow({ message }: EmailRowProps) {
  const from = message.getHeader('from');
  const subject = message.getHeader('subject');
  const { name } = parseFrom(from as string);

  const snippet = useMemo(() => {
    let cleanedUp: string = he.decode(message.snippet);
    if (!cleanedUp.endsWith('.')) cleanedUp = cleanedUp + '...';
    return cleanedUp;
  }, [message.snippet]);

  return (
    <div className='pt-4 pb-3'>
      <div className='text-xs pb-1'>
        <img
          className='rounded-full h-4 w-4 inline-block mr-2'
          src={message.icon}
        />
        {name}
      </div>
      <div className='font-bold'>{subject}</div>
      <div className='text-sm text-gray-700'>{snippet}</div>
    </div>
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

export default function Reader() {
  const { user } = useUser();
  const { data } = useSWR<MessageJSON[], APIError>('/api/messages');

  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const tick = () => setNow(new Date());
    const intervalId = window.setInterval(tick, 60 * 60 * 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const title = useMemo(() => {
    const hourOfDay = now.getHours();
    if (hourOfDay < 12) {
      return `Good morning, ${user.firstName}`;
    } else if (hourOfDay < 18) {
      return `Good afternoon, ${user.firstName}`;
    } else {
      return `Good evening, ${user.firstName}`;
    }
  }, [now, user.firstName]);

  const sections = useMemo(() => {
    if (!data) return [];
    const newSections = [];
    const now = new Date();
    for (const message of data) {
      let added = false;
      const createdAt = new Date(parseInt(message.internalDate));
      for (const section of newSections) {
        if (isSameDay(section.date, createdAt)) {
          section.messages.push(message); // Assuming this is already chronological
          added = true;
          break;
        }
      }
      if (added) continue;
      newSections.push({
        displayDate: isSameDay(now, createdAt)
          ? 'Today'
          : formatDate(createdAt),
        date: createdAt,
        messages: [message],
      });
    }
    return newSections;
  }, [data]);

  return (
    <Content>
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
    </Content>
  );
}
