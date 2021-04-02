import { useCallback, useEffect, useMemo, useState } from 'react';
import NProgress from 'nprogress';
import Router from 'next/router';
import useSWR from 'swr';

import Content from 'components/content';
import Divider from 'components/divider';

import { Filter, User } from 'lib/model/user';
import { Letter, LetterJSON } from 'lib/model/letter';
import { fetcher } from 'lib/fetch';
import { period } from 'lib/utils';
import { useUser } from 'lib/context/user';
import clone from 'lib/utils/clone';

export default function Onboarding() {
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

  const { data } = useSWR<LetterJSON[]>('/api/letters');
  const { user, setUser } = useUser();

  useEffect(() => {
    setSelected(new Set(user.filters.map((f) => f.from)));
  }, [user.filters]);

  const onSave = useCallback(async () => {
    setLoading(true);
    try {
      const selectedLetters = data?.filter((l) => selected.has(l.from));
      if (!selectedLetters || selectedLetters.length === 0) return;

      const filters: Filter[] = clone(user.filters);
      await Promise.all(
        selectedLetters.map(async (nl) => {
          if (filters.some((f) => f.from === nl.from)) return;
          filters.push(await fetcher('/api/filters', 'post', nl.from));
        })
      );

      const updated = new User({ ...user, filters });
      await fetcher('/api/account', 'put', updated.toJSON());
      await setUser(updated);
      await Router.push('/');
    } catch (e) {
      setError(period(e.message));
    }
  }, [selected, data, user, setUser]);

  const important = useMemo(
    () => (data || []).filter((n) => n.category === 'important'),
    [data]
  );
  const other = useMemo(
    () => (data || []).filter((n) => n.category === 'other'),
    [data]
  );

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
                <OnboardingRow
                  key={r.from}
                  letter={Letter.fromJSON(r)}
                  selected={selected.has(r.from)}
                  onSelected={(selected: boolean) => {
                    setSelected((prev) => {
                      const next = clone(prev);
                      console.log(`Is ${r.from} selected?`, selected);
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
                <OnboardingRow
                  key={r.from}
                  letter={Letter.fromJSON(r)}
                  selected={selected.has(r.from)}
                  onSelected={(selected: boolean) => {
                    setSelected((prev) => {
                      const next = clone(prev);
                      console.log(`Is ${r.from} selected?`, selected);
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

interface OnboardingRowProps {
  letter: Letter;
  selected: boolean;
  onSelected: (selected: boolean) => void;
}

function OnboardingRow({ letter, selected, onSelected }: OnboardingRowProps) {
  return (
    <tr onClick={() => onSelected(!selected)}>
      <td className='py-3 w-12'>
        <img className='rounded-full h-8 w-8' src={letter.icon} />
      </td>
      <td>{letter.name}</td>
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
