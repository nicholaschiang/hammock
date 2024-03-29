import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Router from 'next/router';
import { dequal } from 'dequal';
import { mutate } from 'swr';
import useSWRInfinite from 'swr/infinite';

import { SubscriptionsRes } from 'pages/api/subscriptions';

import Avatar from 'components/avatar';
import Button from 'components/button';
import Dialog from 'components/dialog';
import Empty from 'components/empty';
import Page from 'components/page';

import { APIError } from 'lib/model/error';
import { Subscription } from 'lib/model/subscription';
import { User } from 'lib/model/user';
import clone from 'lib/utils/clone';
import { fetcher } from 'lib/fetch';
import { period } from 'lib/utils';
import useLoading from 'lib/hooks/loading';
import { useUser } from 'lib/context/user';

function hasSub(user: User | undefined, sub: Subscription): boolean {
  return !!user && user.subscriptions.some((s) => s.email === sub.email);
}

function addSub(user: User | undefined, sub: Subscription): void {
  if (!hasSub(user, sub)) user?.subscriptions.push(sub);
}

function deleteSub(user: User | undefined, sub: Subscription): void {
  const idx = user?.subscriptions.findIndex((s) => s.email === sub.email);
  if (typeof idx === 'number' && idx >= 0) user?.subscriptions.splice(idx, 1);
}

const NUM_PAGES = 10;
const LOADING_MSGS = [
  'Hang tight, we’re getting your subscriptions from Gmail',
  'Let’s use this time to go through exactly how Hammock works',
  'You’ll soon be choosing which newsletters you want to read in Hammock',
  'For this to work, we first have to do two things in your Gmail account',
  'First, we create a ‘Hammock’ label and apply it to the newsletters you choose',
  'We also create a filter so that those newsletters skip your inbox',
  'This is just so you’re not seeing them both in your inbox and in Hammock',
  'Remember, you can always still search and find your newsletters in Gmail',
  'You can easily revert these changes without messing up Gmail or Hammock',
  'As always, if you ever have any feedback, please reach out... we’re almost done...',
];

interface LoadingDialogProps {
  progress: number;
}

function LoadingDialog({ progress }: LoadingDialogProps): JSX.Element {
  const [message, setMessage] = useState<string>(LOADING_MSGS[progress]);
  useEffect(() => {
    setMessage(() => LOADING_MSGS[Math.min(progress, LOADING_MSGS.length)]);
  }, [progress]);
  const percent = useMemo(
    () => Math.min(Math.max(progress / NUM_PAGES, 0.05), 0.95),
    [progress]
  );

  return (
    <Dialog>
      <h2>{message}</h2>
      <div className='progress'>
        <div className='bar'>
          <div className='peg' />
        </div>
      </div>
      <div className='gif'>
        <div className='placeholder' />
        <Image
          src='/rockets.gif'
          objectPosition='center'
          objectFit='cover'
          layout='fill'
        />
      </div>
      <style jsx>{`
        h2 {
          color: var(--accents-6);
          font-size: 20px;
          font-weight: 400;
          line-height: 24px;
          margin: 48px 0 24px;
          text-align: center;
          max-width: 400px;
        }

        .progress {
          position: absolute;
          top: 0;
          left: 0;
          height: 2px;
          width: 100%;
          z-index: 2;
        }

        @media (max-width: 540px) {
          .progress {
            position: fixed;
          }
        }

        .bar {
          background: var(--primary);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          transition: all 150ms linear;
          transform: translate3d(${(percent - 1) * 100}%, 0, 0);
        }

        .bar > .peg {
          display: block;
          position: absolute;
          right: 0px;
          width: 100px;
          height: 100%;
          box-shadow: 0 0 10px var(--primary), 0 0 5px var(--primary);
          opacity: 1;

          -webkit-transform: rotate(3deg) translate(0px, -4px);
          -ms-transform: rotate(3deg) translate(0px, -4px);
          transform: rotate(3deg) translate(0px, -4px);
        }

        .gif {
          border: 2px solid var(--accents-2);
          border-radius: 10px;
          margin: 24px 0 48px;
          position: relative;
          overflow: hidden;
          height: 200px;
          width: 400px;
          max-width: 100%;
        }

        .gif .placeholder {
          width: 100%;
          height: 100%;
          filter: blur(2rem);
          transform: scale(1.2);
          background-size: 100% 20%;
          background-repeat: no-repeat;
          background-position: 0 0, 0 25%, 0 50%, 0 75%, 0 100%;
          background-image: linear-gradient(
              90deg,
              rgba(178, 195, 214, 255) 10%,
              rgba(143, 166, 191, 255) 10% 20%,
              rgba(116, 142, 173, 255) 20% 30%,
              rgba(93, 122, 161, 255) 30% 40%,
              rgba(78, 109, 150, 255) 40% 50%,
              rgba(69, 100, 143, 255) 50% 60%,
              rgba(57, 90, 137, 255) 60% 70%,
              rgba(57, 86, 127, 255) 70% 80%,
              rgba(73, 81, 88, 255) 80% 90%,
              rgba(69, 76, 80, 255) 90% 100%
            ),
            linear-gradient(
              90deg,
              rgba(190, 206, 220, 255) 10%,
              rgba(160, 181, 205, 255) 10% 20%,
              rgba(133, 158, 188, 255) 20% 30%,
              rgba(110, 139, 174, 255) 30% 40%,
              rgba(89, 120, 160, 255) 40% 50%,
              rgba(91, 119, 155, 255) 50% 60%,
              rgba(92, 120, 157, 255) 60% 70%,
              rgba(80, 109, 146, 255) 70% 80%,
              rgba(77, 96, 119, 255) 80% 90%,
              rgba(78, 96, 119, 255) 90% 100%
            ),
            linear-gradient(
              90deg,
              rgba(221, 230, 233, 255) 10%,
              rgba(180, 198, 215, 255) 10% 20%,
              rgba(146, 171, 201, 255) 20% 30%,
              rgba(126, 155, 191, 255) 30% 40%,
              rgba(121, 147, 177, 255) 40% 50%,
              rgba(125, 147, 171, 255) 50% 60%,
              rgba(120, 146, 175, 255) 60% 70%,
              rgba(110, 138, 172, 255) 70% 80%,
              rgba(104, 134, 171, 255) 80% 90%,
              rgba(110, 138, 173, 255) 90% 100%
            ),
            linear-gradient(
              90deg,
              rgba(245, 252, 246, 255) 10%,
              rgba(230, 239, 237, 255) 10% 20%,
              rgba(202, 215, 222, 255) 20% 30%,
              rgba(178, 196, 212, 255) 30% 40%,
              rgba(176, 190, 201, 255) 40% 50%,
              rgba(162, 178, 193, 255) 50% 60%,
              rgba(141, 162, 185, 255) 60% 70%,
              rgba(133, 156, 182, 255) 70% 80%,
              rgba(128, 150, 175, 255) 80% 90%,
              rgba(125, 147, 172, 255) 90% 100%
            ),
            linear-gradient(
              90deg,
              rgba(98, 101, 95, 255) 10%,
              rgba(113, 115, 106, 255) 10% 20%,
              rgba(115, 116, 109, 255) 20% 30%,
              rgba(138, 138, 128, 255) 30% 40%,
              rgba(127, 127, 118, 255) 40% 50%,
              rgba(127, 127, 117, 255) 50% 60%,
              rgba(131, 131, 120, 255) 60% 70%,
              rgba(127, 127, 117, 255) 70% 80%,
              rgba(117, 117, 104, 255) 80% 90%,
              rgba(101, 100, 85, 255) 90% 100%
            );
        }
      `}</style>
    </Dialog>
  );
}

interface SubscriptionRowProps {
  subscription?: Subscription;
  selected?: boolean;
  onSelected?: (selected: boolean) => void;
}

function SubscriptionRow({
  subscription,
  selected,
  onSelected,
}: SubscriptionRowProps): JSX.Element {
  return (
    <li>
      <button
        type='button'
        className='reset'
        disabled={!onSelected}
        onClick={onSelected ? () => onSelected(!selected) : undefined}
      >
        <Avatar src={subscription?.photo} loading={!subscription} size={36} />
        {!subscription && <span className='name loading' />}
        {subscription && (
          <span className='name nowrap'>{subscription.name}</span>
        )}
        <span className='check'>
          <input
            disabled={!onSelected}
            checked={selected}
            type='checkbox'
            readOnly
          />
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
      </button>
      <style jsx>{`
        li {
          margin: 16px 0;
        }

        li:first-child {
          margin-top: 0;
        }

        button {
          display: flex;
          align-items: center;
          cursor: pointer;
          width: 100%;
        }

        button:disabled {
          cursor: wait;
        }

        button > :global(.avatar) {
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
          color: var(--on-background);
        }

        .name.loading {
          border-radius: 6px;
        }

        .check {
          flex: none;
          display: flex;
          align-items: center;
        }

        .check input {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }

        .check input:disabled + .icon {
          border: 2px solid var(--accents-2);
        }

        .check input:checked + .icon {
          background: var(--accents-6);
        }

        .check .icon {
          border: 2px solid var(--accents-5);
          background: var(--background);
          border-radius: 50%;
          height: 24px;
          width: 24px;
          position: relative;
          transition: border-color 0.15s ease 0s;
        }

        .check input:checked + .icon,
        .check .icon:hover {
          border: 2px solid var(--accents-6);
        }
      `}</style>
    </li>
  );
}

export default function SubscriptionsPage(): JSX.Element {
  const [progress, setProgress] = useState<number>(0);
  const getKey = useCallback(
    (pageIdx: number, prev: SubscriptionsRes | null) => {
      if (!prev || pageIdx === 0) return '/api/subscriptions';
      setProgress((p) => p + 1);
      return `/api/subscriptions?pageToken=${prev.nextPageToken}`;
    },
    []
  );
  const { data } = useSWRInfinite<SubscriptionsRes, APIError>(getKey, {
    revalidateAll: true,
    initialSize: NUM_PAGES,
  });
  const subscriptions = useMemo(() => {
    const subs: Subscription[] = [];
    data?.forEach((d) => {
      d.subscriptions.forEach((s) => {
        if (!subs.find((l) => l.email === s.email)) subs.push(s);
      });
    });
    return subs;
  }, [data]);

  // TODO: Show error message in snackbar or button help text.
  const { loading, setLoading, setError } = useLoading();
  const { user, setUser, setUserMutated } = useUser();

  const onSave = useCallback(async () => {
    setLoading(true);
    try {
      window.analytics?.track('Subscriptions Saved');
      const url = '/api/account';
      await mutate(url, fetcher(url, 'put', user), false);
      setUserMutated(false);
      await Router.push('/');
    } catch (e) {
      setError(period((e as Error).message));
    }
  }, [user, setUserMutated, setLoading, setError]);

  const other = useMemo(
    () => subscriptions.filter((s) => s.category === 'other'),
    [subscriptions]
  );
  const important = useMemo(
    () => subscriptions.filter((s) => s.category === 'important'),
    [subscriptions]
  );
  const loader = useMemo(() => {
    const empty = Array(5).fill(null);
    // eslint-disable-next-line react/no-array-index-key
    return empty.map((_, idx) => <SubscriptionRow key={idx} />);
  }, []);

  // TODO: Ensure that all of the previously selected subscriptions show up in
  // the newsletter list so that users can unselect them as needed (i.e. even if
  // they aren't in the last 100 messages in their Gmail inbox).

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
    setUser((prev) => {
      if (!prev) return undefined;
      const updated = clone(prev);
      // TODO: Perhaps I should add a URL query param that specifies if we want
      // to pre-select all the important subscriptions. Right now, we only
      // pre-select if the user doesn't already have any subscriptions selected.
      if (updated.subscriptions.length) return prev;
      important.forEach((i) => addSub(updated, i));
      if (dequal(updated, prev)) return prev;
      return updated;
    });
  }, [setUser, important]);

  return (
    <Page name='Subscriptions' login>
      <div className='wrapper'>
        {!data && <LoadingDialog progress={progress} />}
        <Head>
          <link
            rel='preload'
            href='/api/subscriptions'
            crossOrigin='anonymous'
            type='application/json'
            as='fetch'
          />
        </Head>
        <h1>Choose what you want to read in your feed</h1>
        <h2>All the Substacks and popular newsletters</h2>
        {!!important.length && (
          <ul>
            {important.map((r) => (
              <SubscriptionRow
                key={r.email}
                subscription={r}
                selected={hasSub(user, r)}
                onSelected={(isSelected: boolean) => {
                  hasBeenUpdated.current = true;
                  window.analytics?.track(
                    `Subscription ${isSelected ? 'Selected' : 'Deselected'}`
                  );
                  setUser((prev) => {
                    if (!prev) return undefined;
                    const updated = clone(prev);
                    if (isSelected) addSub(updated, r);
                    if (!isSelected) deleteSub(updated, r);
                    if (dequal(updated, prev)) return prev;
                    return updated;
                  });
                }}
              />
            ))}
          </ul>
        )}
        {!data && <ul>{loader}</ul>}
        {data && !important.length && <Empty>No newsletters found.</Empty>}
        <h2>Other subscriptions, including promotions</h2>
        {!!other.length && (
          <ul>
            {other.map((r) => (
              <SubscriptionRow
                key={r.email}
                subscription={r}
                selected={hasSub(user, r)}
                onSelected={(isSelected: boolean) => {
                  hasBeenUpdated.current = true;
                  window.analytics?.track(
                    `Subscription ${isSelected ? 'Selected' : 'Deselected'}`
                  );
                  setUser((prev) => {
                    if (!prev) return undefined;
                    const updated = clone(prev);
                    if (isSelected) addSub(updated, r);
                    if (!isSelected) deleteSub(updated, r);
                    if (dequal(updated, prev)) return prev;
                    return updated;
                  });
                }}
              />
            ))}
          </ul>
        )}
        {!data && <ul>{loader}</ul>}
        {data && !other.length && <Empty>No subscriptions found.</Empty>}
        <Button
          disabled={!data || loading || !user?.subscriptions.length}
          onClick={onSave}
        >
          Save subscriptions
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
            position: sticky;
            margin-top: 60px;
            bottom: 12px;
            width: 100%;
          }

          h1 {
            font-size: 30px;
            font-weight: 500;
            line-height: 36px;
            margin: 0;
          }

          h2 {
            color: var(--accents-5);
            font-size: 20px;
            font-weight: 400;
            line-height: 24px;
            margin: 60px 0 36px;
          }

          ul {
            list-style: none;
            padding: 0;
            margin: 0;
          }
        `}</style>
      </div>
    </Page>
  );
}
