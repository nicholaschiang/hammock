import { MouseEvent, useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import cn from 'classnames';
import { mutate } from 'swr';

import Avatar from 'components/avatar';
import Empty from 'components/empty';
import Layout from 'components/layout';
import Page from 'components/page';
import StarBorderIcon from 'components/icons/star-border';
import StarIcon from 'components/icons/star';

import { Message } from 'lib/model/message';
import { Subscription } from 'lib/model/subscription';
import breakpoints from 'lib/breakpoints';
import { fetcher } from 'lib/fetch';
import useFetch from 'lib/hooks/fetch';
import { useUser } from 'lib/context/user';

interface WriterRowProps {
  sub?: Subscription;
}

function WriterRow({ sub }: WriterRowProps): JSX.Element {
  const { user, setUser } = useUser();
  const favorite = useCallback(
    (evt: MouseEvent<HTMLButtonElement>) => {
      evt.preventDefault();
      evt.stopPropagation();
      if (!sub || !user) return;
      const idx = user.subscriptions.indexOf(sub);
      const subscription = { ...sub, favorite: !sub.favorite };
      const subs = [
        ...user.subscriptions.slice(0, idx),
        subscription,
        ...user.subscriptions.slice(idx + 1),
      ];
      setUser({ ...user, subscriptions: subs });
    },
    [sub, user, setUser]
  );

  return (
    <Link href={sub ? `/writers/${sub.email}` : ''}>
      <a>
        <li className={cn({ disabled: !sub })}>
          <Avatar src={sub?.photo} loading={!sub} size={36} />
          {!sub && <div className='name-wrapper loading' />}
          {sub && (
            <div className='name-wrapper'>
              <span className='name nowrap'>{sub.name}</span>
              <button
                onClick={favorite}
                type='button'
                className='reset favorite'
              >
                {sub.favorite && <StarIcon />}
                {!sub.favorite && <StarBorderIcon />}
              </button>
            </div>
          )}
        </li>
        <style jsx>{`
          a {
            text-decoration: none;
            color: unset;
          }

          li {
            display: flex;
            align-items: center;
            margin: 16px 0;
            cursor: pointer;
          }

          li.disabled {
            cursor: wait;
          }

          li:first-child {
            margin-top: 0;
          }

          li > :global(.avatar) {
            flex: none;
          }

          .name-wrapper {
            flex: 1 1 auto;
            width: 0;
            display: flex;
            align-items: center;
            margin-left: 24px;
            height: 18px;
          }

          .name-wrapper.loading {
            border-radius: 6px;
          }

          .name {
            font-size: 16px;
            font-weight: 400;
            line-height: 18px;
            height: 18px;
          }

          button.favorite {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 100%;
            transition: opacity 0.2s ease 0s;
            margin-left: 12px;
            opacity: 0;
          }

          button.favorite:disabled {
            cursor: wait;
          }

          button.favorite :global(svg) {
            fill: var(--accents-5);
            transition: fill 0.2s ease 0s;
          }

          button.favorite:hover :global(svg) {
            fill: var(--on-background);
          }

          li:hover button.favorite {
            opacity: 1;
          }
        `}</style>
      </a>
    </Link>
  );
}

export default function WritersPage(): JSX.Element {
  const { user, loggedIn, setUserMutated } = useUser();
  const { data } = useFetch<Message>('message', '/api/messages');
  useEffect(() => {
    async function save(): Promise<void> {
      const url = '/api/account';
      await mutate(url, fetcher(url, 'put', user), false);
      setUserMutated(false);
    }
    const timeoutId = setTimeout(() => {
      void save();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [user, setUserMutated]);

  const subscriptions = useMemo(
    () =>
      (user?.subscriptions || []).sort((a, b) => {
        if (!data) {
          if (a.name < b.name) return -1;
          if (a.name > b.name) return 1;
          return 0;
        }
        const messages = data
          .flat()
          .sort(
            (c, d) => new Date(d.date).valueOf() - new Date(c.date).valueOf()
          );
        const idxA = messages.findIndex((l) => l.email === a.email);
        const idxB = messages.findIndex((l) => l.email === b.email);
        // B goes after A because B isn't in the feed
        if (idxA !== -1 && idxB === -1) return -1;
        // A goes after B because A isn't in the feed
        if (idxA === -1 && idxB !== -1) return 1;
        // Neither are in the feed; sort alphabetically.
        if (idxA === -1 && idxB === -1) {
          if (a.name < b.name) return -1;
          if (a.name > b.name) return 1;
          return 0;
        }
        // B goes after A because it appears later in the feed
        if (idxA < idxB) return -1;
        // A goes after B because it appears later in the feed
        if (idxA > idxB) return 1;
        return 0;
      }),
    [data, user?.subscriptions]
  );
  const favorites = useMemo(
    () => subscriptions.filter((s) => s.favorite),
    [subscriptions]
  );
  const all = useMemo(
    () => subscriptions.filter((s) => !s.favorite),
    [subscriptions]
  );

  const loader = useMemo(() => {
    const empty = Array(5).fill(null);
    // eslint-disable-next-line react/no-array-index-key
    return empty.map((_, idx) => <WriterRow key={idx} />);
  }, []);

  return (
    <Page name='Writers' login sync>
      <Layout>
        <h2>Favorites</h2>
        {!loggedIn && <ul>{loader}</ul>}
        {loggedIn && !!favorites.length && (
          <ul>
            {favorites.map((sub) => (
              <WriterRow key={sub.email} sub={sub} />
            ))}
          </ul>
        )}
        {loggedIn && !favorites.length && (
          <Empty>
            Click on a star next to a writer below to add them to favorites.
          </Empty>
        )}
        <h2>All</h2>
        {!loggedIn && <ul>{loader}</ul>}
        {loggedIn && !!all.length && (
          <ul>
            {all.map((sub) => (
              <WriterRow key={sub.email} sub={sub} />
            ))}
          </ul>
        )}
        {loggedIn && !all.length && <Empty>No writers to show.</Empty>}
        <style jsx>{`
          h2 {
            font-size: 1rem;
            font-weight: 400;
            color: var(--accents-5);
            margin: 48px 0 12px;
          }

          h2:first-of-type {
            margin-top: 0;
          }

          ul {
            list-style: none;
            padding: 0;
            margin: 0;
          }

          @media (max-width: ${breakpoints.mobile}) {
            h2:first-of-type {
              margin-top: 24px;
            }
          }

          :global(.empty) {
            margin-top: 24px !important;
            height: unset !important;
          }
        `}</style>
      </Layout>
    </Page>
  );
}
