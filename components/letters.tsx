import { mutate, useSWRInfinite } from 'swr';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import NProgress from 'nprogress';
import Router from 'next/router';

import { LettersRes } from 'pages/api/letters';

import Avatar from 'components/avatar';
import Button from 'components/button';

import { Filter, User } from 'lib/model/user';
import { Letter, LetterJSON } from 'lib/model/letter';
import clone from 'lib/utils/clone';
import { fetcher } from 'lib/fetch';
import { period } from 'lib/utils';
import { useUser } from 'lib/context/user';

interface LetterRowProps {
  letter: Letter;
  selected: boolean;
  onSelected: (selected: boolean) => void;
}

function LetterRow({ letter, selected, onSelected }: LetterRowProps) {
  return (
    <tr onClick={() => onSelected(!selected)}>
      <td className='avatar'>
        <div className='border'>
          <Avatar src={letter.icon} size={40} />
        </div>
      </td>
      <td className='title'>
        <div className='name'>{letter.name}</div>
        <div className='email'>{letter.from}</div>
      </td>
      <td className='checkbox'>
        {selected && (
          <svg viewBox='0 0 35 35' fill='none'>
            <circle
              cx='17.5'
              cy='17.5'
              r='16.5'
              fill='#6C7176'
              stroke='#6C7176'
              strokeWidth='2'
            />
            <rect
              x='12'
              y='23.3574'
              width='21'
              height='4'
              rx='2'
              transform='rotate(-46.9964 12 23.3574)'
              fill='white'
            />
            <rect
              x='14.4854'
              y='26.3135'
              width='12'
              height='4'
              rx='2'
              transform='rotate(-135 14.4854 26.3135)'
              fill='white'
            />
          </svg>
        )}
        {!selected && (
          <svg viewBox='0 0 24 24'>
            <circle
              cx='12'
              cy='12'
              r='11'
              stroke='#6C7176'
              strokeWidth='2'
              fill='none'
            />
          </svg>
        )}
      </td>
      <style jsx>{`
        tr {
          border-radius: 8px;
          transition: box-shadow 0.2s ease 0s;
        }

        tr:hover {
          box-shadow: var(--shadow-small);
        }

        td {
          padding: 12px 0;
          cursor: pointer;
          vertical-align: middle;
        }

        td.avatar {
          width: 40px;
          padding: 12px;
        }

        td.avatar > .border {
          border-radius: 100%;
          border: 2px solid var(--accents-2);
        }

        td.title {
          font-size: 14px;
          font-weight: 400;
        }

        td.title > .email {
          color: var(--accents-5);
        }

        td.checkbox {
          width: 24px;
          padding: 22px;
        }

        svg {
          width: 24px;
          height: 24px;
          display: block;
        }
      `}</style>
    </tr>
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
    void setSize((prev) => (prev >= 10 ? prev : prev + 1));
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
      {data && (
        <table>
          <tbody>
            {letters
              .filter((l) => l.category === 'important')
              .map((r) => (
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
          </tbody>
        </table>
      )}
      <h2>Other “newsletters” in your inbox that we found less relevant</h2>
      <div className='line' />
      {data && (
        <table>
          <tbody>
            {letters
              .filter((l) => l.category === 'other')
              .map((r) => (
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
          </tbody>
        </table>
      )}
      <style jsx>{`
        .wrapper {
          flex: 1 1 auto;
          max-width: 768px;
          width: 0;
        }

        .line {
          border-top: 2px solid var(--accents-2);
          margin: 24px;
        }

        header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin: 0 24px;
        }

        header h1 {
          font-size: 48px;
          font-weight: 400;
          line-height: 48px;
          margin: 0 0 12px;
        }

        header h2 {
          margin: 0;
        }

        h2 {
          font-size: 16px;
          font-weight: 400;
          line-height: 24px;
          color: var(--accents-5);
          margin: 72px 24px 12px;
        }

        table {
          width: 100%;
          padding: 0 12px;
          border-spacing: 0px;
          border-collapse: separate;
        }
      `}</style>
    </div>
  );
}
