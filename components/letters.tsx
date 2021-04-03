import { useCallback, useEffect, useMemo, useState } from 'react';
import { mutate, useSWRInfinite } from 'swr';
import NProgress from 'nprogress';
import Router from 'next/router';

import Content from 'components/content';
import Divider from 'components/divider';

import { LettersRes } from 'pages/api/letters';

import { Filter, User } from 'lib/model/user';
import { Letter, LetterJSON } from 'lib/model/letter';
import { fetcher } from 'lib/fetch';
import { period } from 'lib/utils';
import { useUser } from 'lib/context/user';
import clone from 'lib/utils/clone';

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
    if (prev && !prev.letters.length) return null;
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
    if (data) setSize((prev) => (prev >= 10 ? prev : prev + 1));
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

  const important = useMemo(
    () => letters.filter((l) => l.category === 'important'),
    [letters]
  );
  const other = useMemo(() => letters.filter((l) => l.category === 'other'), [
    letters,
  ]);

  return (
    <Content>
      <div className='header flex items-center pb-2'>
        <div className='left flex-grow'>
          <div className='text-5xl font-weight-500 pb-2'>Your Newsletters</div>
          <div className='text-lg text-gray-500'>
            Choose the subscriptions you want to read in your feed
          </div>
        </div>
        <div className='right flex-none'>
          <button
            className='bg-blue-500 hover:bg-blue-700 text-white py-2 px-3 rounded'
            disabled={loading}
            onClick={onSave}
          >
            Go to your feed
          </button>
        </div>
      </div>
      <Divider />
      {!data && (
        <>
          <div className='text-center pb-4 pt-12'>
            <svg className='animate-spin h-8 w-8 mx-auto' viewBox='0 0 24 24'>
              <path
                className='opacity-75'
                fill='black'
                d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
              ></path>
            </svg>
          </div>
          <div className='text-sm text-center'>
            Loading Recent Emails <br /> (This might take a minute)
          </div>
        </>
      )}
      {data && (
        <>
          <table className='w-full my-2'>
            <tbody>
              {important.map((r) => (
                <LetterRow
                  key={r.from}
                  letter={Letter.fromJSON(r)}
                  selected={selected.has(r.from)}
                  onSelected={(selected: boolean) => {
                    setSelected((prev) => {
                      const next = clone(prev);
                      if (!selected) next.delete(r.from);
                      if (selected) next.add(r.from);
                      return next;
                    });
                  }}
                />
              ))}
            </tbody>
          </table>
          <p className='text-lg text-gray-500 pt-10'>
            Other “newsletters” in your inbox that we found less relevant
          </p>
          <table className='w-full my-2'>
            <tbody>
              {other.map((r) => (
                <LetterRow
                  key={r.from}
                  letter={Letter.fromJSON(r)}
                  selected={selected.has(r.from)}
                  onSelected={(selected: boolean) => {
                    setSelected((prev) => {
                      const next = clone(prev);
                      if (!selected) next.delete(r.from);
                      if (selected) next.add(r.from);
                      return next;
                    });
                  }}
                />
              ))}
            </tbody>
          </table>
        </>
      )}
    </Content>
  );
}

interface LetterRowProps {
  letter: Letter;
  selected: boolean;
  onSelected: (selected: boolean) => void;
}

function LetterRow({ letter, selected, onSelected }: LetterRowProps) {
  return (
    <tr onClick={() => onSelected(!selected)}>
      <td className='py-3 w-12'>
        <img className='rounded-full h-8 w-8' src={letter.icon} />
      </td>
      <td>{`${letter.name} (${letter.from})`}</td>
      <td className='text-right'>
        {selected && (
          <svg
            className='block mr-0 ml-auto fill-current w-6 h-6 text-white pointer-events-none'
            viewBox='0 0 35 35'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
          >
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
          <svg
            className='block mr-0 ml-auto fill-current w-6 h-6 text-green-500 pointer-events-none'
            viewBox='0 0 24 24'
          >
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
    </tr>
  );
}
