import { useEffect, useMemo, useState } from 'react';
import cn from 'classnames';

import Avatar from 'components/avatar';
import Empty from 'components/empty';

import { Subscription } from 'lib/model/subscription';
import { useUser } from 'lib/context/user';

interface WriterRowProps {
  writer?: Subscription;
}

function WriterRow({ writer }: WriterRowProps): JSX.Element {
  return (
    <li className={cn({ disabled: !writer })}>
      <Avatar
        src={writer?.from.photo}
        loading={!writer}
        size={36}
      />
      {!writer && <span className='name loading' />}
      {writer && (
        <span className='name nowrap'>{writer.from.name}</span>
      )}
      <style jsx>{`
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
      `}</style>
    </li>
  );
}
export default function Writers(): JSX.Element {
  const { user, loggedIn } = useUser();
  
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const tick = () => setNow(new Date());
    const intervalId = window.setInterval(tick, 60 * 60 * 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const title = useMemo(() => {
    if (!user.firstName) return '';
    const hourOfDay = now.getHours();
    if (hourOfDay < 12) return `Good morning, ${user.firstName}`;
    if (hourOfDay < 18) return `Good afternoon, ${user.firstName}`;
    return `Good evening, ${user.firstName}`;
  }, [now, user.firstName]);
  const loadingList = useMemo(
    () =>
      Array(5)
        .fill(null)
        .map((_, idx) => <WriterRow key={idx} />),
    []
  );

  return (
    <div className='wrapper'>
      <header>
        <h1 className={cn('nowrap', { loading: !title })}>{title}</h1>
      </header>
      {!loggedIn && <ul>{loadingList}</ul>}
      {loggedIn && !!user.subscriptions.length && (
        <ul>
          {user.subscriptions.map((writer) => (
            <WriterRow key={writer.from.email} writer={writer} />
          ))}
        </ul>
      )}
      {loggedIn && !user.subscriptions.length && (
        <Empty>No writers to show</Empty>
      )}
      <style jsx>{`
        .wrapper {
          flex: 1 1 auto;
          max-width: 768px;
          width: 0;
        }

        .wrapper > :global(.empty) {
          height: 400px;
          margin: 24px;
        }
        
        header {
          margin: 0 24px;
        }

        header > h1 {
          font-size: 48px;
          font-weight: 400;
          line-height: 64px;
          height: 64px;
          margin: -12px 0 72px;
          position: relative;
          z-index: 3;
        }

        header > h1.loading {
          border-radius: 6px;
          max-width: 500px;
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
