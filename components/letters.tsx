import { mutate, useSWRInfinite } from 'swr';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import NProgress from 'nprogress';
import Router from 'next/router';

import { LettersRes } from 'pages/api/letters';

import Avatar from 'components/avatar';
import Button from 'components/button';
import Empty from 'components/empty';

import { Filter, User } from 'lib/model/user';
import { Letter, LetterJSON } from 'lib/model/letter';
import clone from 'lib/utils/clone';
import { fetcher } from 'lib/fetch';
import { period } from 'lib/utils';
import { useUser } from 'lib/context/user';

interface LetterRowProps {
  letter?: Letter;
  selected?: boolean;
  onSelected?: (selected: boolean) => void;
}

function LetterRow({ letter, selected, onSelected }: LetterRowProps) {
  return (
    <li onClick={() => onSelected && onSelected(!selected)}>
      <span className='check'>
        <input type='checkbox' checked={selected || false} />
        <span className='icon' aria-hidden='true'>
          <svg viewBox='0 0 20 20' height='16' width='16' fill='none'>
            {selected && (
              <path
                d='M14 7L8.5 12.5L6 10'
                stroke='var(--on-primary)'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            )}
          </svg>
        </span>
      </span>
      <Avatar src={letter?.icon} loading={!letter} size={24} />
      {!letter && <span className='name loading' />}
      {letter && (
        <span className='name nowrap'>
          {letter.name}
          <span className='dot'>·</span>
          <span className='email'>{letter.from}</span>
        </span>
      )}
      <style jsx>{`
        li {
          display: flex;
          align-items: center;
          margin: 16px 0;
        }

        li:first-child {
          margin-top: 0;
        }

        li > :global(div) {
          margin: 0 12px;
          flex: none;
        }

        .name {
          flex: 1 1 auto;
          width: 0;
          font-size: 16px;
          font-weight: 400;
          line-height: 18px;
          height: 18px;
        }

        .name.loading {
          border-radius: 6px;
        }

        .dot {
          margin: 0 8px;
        }

        .email {
          color: var(--accents-5);
        }

        .check {
          flex: none;
          display: flex;
          align-items: center;
          cursor: pointer;
        }

        .check input {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0,0,0,0);
          white-space: nowrap;
          border-width: 0;
        }

        .check input:checked + .icon {
          background: var(--primary);
        }

        .check .icon {
          border: 2px solid var(--primary);
          background: var(--background);
          border-radius: 4px;
          height: 20px;
          width: 20px;
          position: relative;
          transition: border-color 0.15s ease 0s;
          transform: transform: rotate(0.000001deg);
        }
      `}</style>
    </li>
  );
}

export default function Letters() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!loading) {
      NProgress.done();
    } else {
      NProgress.start();
      setError('');
    }
  }, [loading]);
  useEffect(() => {
    if (error) setLoading(false);
  }, [error]);

  const getKey = useCallback((pageIdx: number, prev: LettersRes | null) => {
    if (!prev || pageIdx === 0) return '/api/letters';
    return `/api/letters?pageToken=${prev.nextPageToken}`;
  }, []);

  const { data, setSize } = useSWRInfinite<LettersRes>(getKey);
  const { user } = useUser();

  const letters = useMemo(() => {
    const noDuplicates: LetterJSON[] = [];
    data?.forEach((d) => {
      d.letters.forEach((l) => {
        if (!noDuplicates.some((n) => n.from === l.from)) noDuplicates.push(l);
      });
    });
    return noDuplicates;
  }, [data]);

  useEffect(() => {
    if (!data) return;
    void setSize((prev) => (prev >= 25 ? prev : prev + 1));
  }, [data, setSize]);
  useEffect(() => {
    setSelected(new Set(user.filter.senders));
  }, [user.filter.senders]);

  const onSave = useCallback(async () => {
    setLoading(true);
    try {
      const selectedLetters = letters.filter((l) => selected.has(l.from));
      if (!selectedLetters || selectedLetters.length === 0) return;

      const filter: Filter = { id: user.filter.id, senders: [] };
      selectedLetters.forEach((l) => {
        if (!filter.senders.includes(l.from)) filter.senders.push(l.from);
      });

      const url = '/api/account';
      const updated = new User({ ...user, filter });
      await mutate(url, fetcher(url, 'put', updated.toJSON()));
      await Router.push('/');
    } catch (e) {
      setError(period(e.message));
    }
  }, [selected, letters, user]);

  const { other, important } = useMemo(
    () => ({
      other: letters.filter((l) => l.category === 'other'),
      important: letters.filter((l) => l.category === 'important'),
    }),
    [letters]
  );

  return (
    <div className='wrapper'>
      <Head>
        <link rel='preload' href='/api/letters' as='fetch' />
      </Head>
      <header>
        <div className='content'>
          <h1>Your newsletters</h1>
          <h2>Choose the subscriptions you want to read in your feed</h2>
        </div>
        <Button disabled={loading} onClick={onSave}>
          Go to your feed
        </Button>
      </header>
      <div className='line' />
      {false && !!important.length && (
        <ul>
          {important.map((r) => (
            <LetterRow
              key={r.from}
              letter={Letter.fromJSON(r)}
              selected={selected.has(r.from)}
              onSelected={(isSelected: boolean) => {
                setSelected((prev) => {
                  const next = clone(prev);
                  if (!isSelected) next.delete(r.from);
                  if (isSelected) next.add(r.from);
                  return next;
                });
              }}
            />
          ))}
        </ul>
      )}
      {!data && (
        <ul>
          {Array(5)
            .fill(null)
            .map((_, idx) => (
              <LetterRow key={idx} />
            ))}
        </ul>
      )}
      {data && !important.length && <Empty>NO SUBSCRIPTIONS TO SHOW</Empty>}
      <h2>Other “newsletters” in your inbox that we found less relevant</h2>
      <div className='line' />
      {!!other.length && (
        <ul>
          {other.map((r) => (
            <LetterRow
              key={r.from}
              letter={Letter.fromJSON(r)}
              selected={selected.has(r.from)}
              onSelected={(isSelected: boolean) => {
                setSelected((prev) => {
                  const next = clone(prev);
                  if (!isSelected) next.delete(r.from);
                  if (isSelected) next.add(r.from);
                  return next;
                });
              }}
            />
          ))}
        </ul>
      )}
      {!data && (
        <ul>
          {Array(5)
            .fill(null)
            .map((_, idx) => (
              <LetterRow key={idx} />
            ))}
        </ul>
      )}
      {data && !other.length && <Empty>NO NEWSLETTERS TO SHOW</Empty>}
      <style jsx>{`
        .wrapper {
          flex: 1 1 auto;
          max-width: 768px;
          padding: 0 24px;
          width: 0;
        }

        .wrapper :global(.empty) {
          margin-bottom: 72px;
          height: 300px;
        }

        .line {
          border-top: 2px solid var(--accents-2);
          margin: 24px 0 36px;
        }

        header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }

        header h1 {
          font-size: 48px;
          font-weight: 400;
          line-height: 64px;
          margin: 0 0 48px;
          height: 64px;
        }

        h2 {
          color: var(--accents-5);
          font-size: 18px;
          font-weight: 700;
          line-height: 24px;
          height: 24px;
          margin: 0;
        }

        ul {
          list-style: none;
          margin: 0 0 72px;
          padding: 0;
        }

        ul:last-child {
          margin-bottom: 0;
        }
      `}</style>
    </div>
  );
}
