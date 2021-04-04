import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { dequal } from 'dequal';
import { useRouter } from 'next/router';
import { useSWRInfinite } from 'swr';

import { MessagesRes } from 'pages/api/messages';

import CloseIcon from 'components/icons/close';
import ChevronLeftIcon from 'components/icons/chevron-left';
import ChevronRightIcon from 'components/icons/chevron-right';

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
    <div className='controls'>
      <Link href='/'>
        <a className='button'>
          <CloseIcon />
        </a>
      </Link>
      <Link href={pos.prevId ? `/messages/${pos.prevId}` : '/'}>
        <a className='button'>
          <ChevronLeftIcon />
        </a>
      </Link>
      <Link href={pos.nextId ? `/messages/${pos.nextId}` : '/'}>
        <a className='button'>
          <ChevronRightIcon />
        </a>
      </Link>
      <style jsx>{`
        .controls {
          position: fixed;
          top: 48px;
          left: 48px;
          background: var(--background);
          border: 2px solid var(--accents-2);
          border-radius: 30px;
          height: 60px;
          display: flex;
          flex-direction: row;
          padding: 4px;
        }

        .button {
          display: block;
          width: 48px;
          height: 48px;
          padding: 12px;
          border-radius: 100%;
          transition: background 0.1s ease 0s;
        }

        .button:hover {
          background: var(--accents-2);
        }
      `}</style>
    </div>
  );
}
