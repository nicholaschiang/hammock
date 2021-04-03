import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { dequal } from 'dequal';
import { useRouter } from 'next/router';
import { useSWRInfinite } from 'swr';

import { MessagesRes } from 'pages/api/messages';

import { prefetch } from 'lib/fetch';

interface Position {
  prevId: string;
  currId: string;
  nextId: string;
}

export default function Controls(): JSX.Element {
  const getKey = useCallback((pageIdx: number, prev: MessagesRes | null) => {
    if (!prev || pageIdx === 0) return '/api/messages';
    return `/api/messages?pageToken=${prev.nextPageToken}`;
  }, []);

  const { query } = useRouter();
  const { data, setSize } = useSWRInfinite<MessagesRes>(getKey);

  const [pos, setPos] = useState<Position>({
    prevId: '',
    currId: '',
    nextId: '',
  });
  useEffect(() => {
    console.log(`Resetting position b/c of query ID (${query.id}) change...`);
    setPos((prev) => ({
      prevId: prev.nextId === query.id ? prev.currId : '',
      nextId: prev.prevId === query.id ? prev.currId : '',
      currId: typeof query.id === 'string' ? query.id : '',
    }));
  }, [query.id]);
  useEffect(() => {
    if (!data) console.log('No data yet, skipping position query...');
    if (!query.id) console.log('No query ID yet, skipping position query...');
    if (!data || !query.id) return;
    data
      .map((l) => l.messages)
      .flat()
      .forEach((message, idx, messages) => {
        if (message.id !== query.id) return;
        const prevId = messages[idx - 1]?.id || '';
        const nextId = messages[idx + 1]?.id || '';
        if (!prevId) {
          console.log('Could not find prev message.');
        } else {
          console.log(`Found prev message (${prevId}).`);
        }
        if (!nextId) {
          console.log(`Could not find next message, fetching more...`);
          void setSize((prev) => prev + 1);
        } else {
          console.log(`Found next message (${nextId}).`);
        }
        setPos((prev) => {
          const updated = { ...prev, prevId, nextId };
          if (dequal(prev, updated)) return prev;
          return updated;
        });
      });
  }, [data, query.id, setSize]);
  useEffect(() => {
    void prefetch(pos.prevId && `/api/messages/${pos.prevId}`);
    void prefetch(pos.nextId && `/api/messages/${pos.nextId}`);
  }, [pos.prevId, pos.nextId]);

  return (
    <div className='px-4 pt-4 pb-1 fixed top-0'>
      <div className='flex'>
        <div className='rounded-full shadow-sm hover:shadow w-10 h-10 border-2 flex items-center justify-center mr-2 cursor-pointer'>
          <Link href='/'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='w-3 h-3 text-gray-600 hover:text-black'
              viewBox='0 0 24 24'
            >
              <path
                fill='currentcolor'
                d='M12 11.293l10.293-10.293.707.707-10.293 10.293 10.293 10.293-.707.707-10.293-10.293-10.293 10.293-.707-.707 10.293-10.293-10.293-10.293.707-.707 10.293 10.293z'
              />
            </svg>
          </Link>
        </div>
        <div className='rounded-3xl shadow-sm hover:shadow w-20 h-10 border-2 flex items-center justify-between px-4'>
          <Link href={pos.prevId ? `/messages/${pos.prevId}` : '/'}>
            <svg
              className='w-3 h-3 text-gray-600 hover:text-black cursor-pointer'
              xmlns='http://www.w3.org/2000/svg'
              fillRule='evenodd'
              clipRule='evenodd'
              viewBox='0 0 24 24'
            >
              <path
                fill='currentcolor'
                d='M20 .755l-14.374 11.245 14.374 11.219-.619.781-15.381-12 15.391-12 .609.755z'
              />
            </svg>
          </Link>
          <Link href={pos.nextId ? `/messages/${pos.nextId}` : '/'}>
            <svg
              className='w-3 h-3 text-gray-600 hover:text-blac cursor-pointer'
              xmlns='http://www.w3.org/2000/svg'
              fillRule='evenodd'
              clipRule='evenodd'
              viewBox='0 0 24 24'
            >
              <path
                fill='currentcolor'
                d='M4 .755l14.374 11.245-14.374 11.219.619.781 15.381-12-15.391-12-.609.755z'
              />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
