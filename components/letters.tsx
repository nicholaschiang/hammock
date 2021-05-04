import { mutate, useSWRInfinite } from 'swr';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import NProgress from 'nprogress';
import Router from 'next/router';
import { dequal } from 'dequal';

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
      <Avatar src={letter?.icon} loading={!letter} size={36} />
      {!letter && <span className='name loading' />}
      {letter && <span className='name nowrap'>{letter.name}</span>}
      <span className='check'>
        <input type='checkbox' checked={selected || false} />
        <span className='icon' aria-hidden='true'>
          <svg viewBox='0 0 24 24' height='24' width='24' fill='none'>
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
      <style jsx>{`
        li {
          display: flex;
          align-items: center;
          margin: 16px 0;
        }

        li:first-child {
          margin-top: 0;
        }

        li > :global(.avatar) {
          flex: none;
        }

        .name {
          flex: 1 1 auto;
          width: 0;
          font-size: 16px;
          font-weight: 400;
          line-height: 18px;
          height: 18px;
          margin: 0 24px;
        }

        .name.loading {
          border-radius: 6px;
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
          background: var(--accents-4);
        }

        .icon svg {
          fill: none;
        }

        .check .icon {
          border: 2px solid var(--accents-4);
          background: var(--background);
          border-radius: 50%;
          height: 24px;
          width: 24px;
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
    void setSize((prev) => (prev >= 50 ? prev : prev + 1));
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

  const other = useMemo(() => letters.filter((l) => l.category === 'other'), [
    letters,
  ]);
  const important = useMemo(
    () => letters.filter((l) => l.category === 'important'),
    [letters]
  );
  const loadingList = useMemo(
    () =>
      Array(5)
        .fill(null)
        .map((_, idx) => <LetterRow key={idx} />),
    []
  );

  // Pre-select all of the "important" newsletters. From @martinsrna:
  // > The reason is that in the whitelist "database" we created (that decides
  // > if a newsletter is important or not), there are mostly substacks and more
  // > popular newsletters people in general subscribe to.
  // >
  // > There's a very high probability they want to have them in their feed.
  // > It's more likely that users only want to uncheck some of them.
  useEffect(() => {
    setSelected((prev) => {
      const next = [...prev, ...important.map((l) => l.from)];
      if (dequal([...prev], next)) return prev;
      return new Set(next);
    });
  }, [important]);

  return (
    <div className='wrapper'>
      <Head>
        <link rel='preload' href='/api/letters' as='fetch' />
      </Head>
      <h1>Choose what you want to read in your feed</h1>
      <h2>All the Substacks and popular newsletters</h2>
      {!!important.length && (
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
      {!data && <ul>{loadingList}</ul>}
      {data && !important.length && <Empty>No newsletters found</Empty>}
      <h2>Other subscriptions, including promotions</h2>
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
      {!data && <ul>{loadingList}</ul>}
      {data && !other.length && <Empty>No subscriptions found</Empty>}
      <Button disabled={loading} onClick={onSave}>
        Go to your feed
      </Button>
      <style jsx>{`
        .wrapper {
          max-width: 724px;
          padding: 0 48px;
          margin: 96px auto;
        }

        .wrapper > :global(.empty) {
          height: 300px;
        }

        .wrapper > :global(button) {
          margin-top: 60px;
          width: 100%;
        }

        h1 {
          font-size: 30px;
          font-weight: 500;
          line-height: 36px;
          height: 36px;
          margin: 0;
        }

        h2 {
          color: var(--accents-5);
          font-size: 20px;
          font-weight: 400;
          line-height: 24px;
          height: 24px;
          margin: 60px 0 36px;
        }

        ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
      `}</style>
    </div>
  );
}
