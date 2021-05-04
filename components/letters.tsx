import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useSWR, { mutate } from 'swr';
import Head from 'next/head';
import NProgress from 'nprogress';
import Router from 'next/router';
import { dequal } from 'dequal';

import { LettersRes } from 'pages/api/letters';

import Avatar from 'components/avatar';
import Button from 'components/button';
import Empty from 'components/empty';

import { Filter, User } from 'lib/model/user';
import { Letter } from 'lib/model/letter';
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
  const [checked, setChecked] = useState<boolean>(selected || false);
  useEffect(() => setChecked((prev) => selected || prev), [selected]);
  const onClick = useCallback(
    () => (onSelected ? onSelected(!selected) : setChecked((prev) => !prev)),
    [onSelected, selected]
  );

  return (
    <li onClick={onClick}>
      <Avatar src={letter?.icon} loading={!letter} size={36} />
      {!letter && <span className='name loading' />}
      {letter && <span className='name nowrap'>{letter.name}</span>}
      <span className='check'>
        <input type='checkbox' checked={checked} readOnly />
        <span className='icon' aria-hidden='true'>
          <svg viewBox='0 0 24 24' height='24' width='24' fill='none'>
            {checked && (
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
          background: var(--accents-5);
        }

        .icon svg {
          fill: none;
        }

        .check .icon {
          border: 2px solid var(--accents-5);
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

  const { data: letters } = useSWR<LettersRes>('/api/letters');
  const { user } = useUser();

  const onSave = useCallback(async () => {
    setLoading(true);
    try {
      const selectedLetters = letters?.filter((l) => selected.has(l.from));
      if (!selectedLetters?.length) return;

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

  const other = useMemo(
    () => (letters || []).filter((letter) => letter.category === 'other'),
    [letters]
  );
  const important = useMemo(
    () => (letters || []).filter((letter) => letter.category === 'important'),
    [letters]
  );
  const loadingList = useMemo(
    () =>
      Array(5)
        .fill(null)
        .map((_, idx) => <LetterRow key={idx} />),
    []
  );

  // Select all the saved newsletters (that the user has previously selected).
  // TODO: Ensure that all of these show up in the newsletter list so that users
  // can unselect them as needed (i.e. even if they aren't in the last 5000
  // messages in their Gmail inbox).
  useEffect(() => {
    setSelected(new Set(user.filter.senders));
  }, [user.filter.senders]);

  // Pre-select all of the "important" newsletters. From @martinsrna:
  // > The reason is that in the whitelist "database" we created (that decides
  // > if a newsletter is important or not), there are mostly substacks and more
  // > popular newsletters people in general subscribe to.
  // >
  // > There's a very high probability they want to have them in their feed.
  // > It's more likely that users only want to uncheck some of them.
  const hasBeenUpdated = useRef<boolean>(false);
  useEffect(() => {
    if (hasBeenUpdated.current) return;
    setSelected((prev) => {
      const next = new Set([...prev, ...important.map((l) => l.from)]);
      if (dequal([...prev], [...next])) return prev;
      return next;
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
                hasBeenUpdated.current = true;
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
      {!letters && <ul>{loadingList}</ul>}
      {letters && !important.length && <Empty>No newsletters found</Empty>}
      <h2>Other subscriptions, including promotions</h2>
      {!!other.length && (
        <ul>
          {other.map((r) => (
            <LetterRow
              key={r.from}
              letter={Letter.fromJSON(r)}
              selected={selected.has(r.from)}
              onSelected={(isSelected: boolean) => {
                hasBeenUpdated.current = true;
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
      {!letters && <ul>{loadingList}</ul>}
      {letters && !other.length && <Empty>No subscriptions found</Empty>}
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
