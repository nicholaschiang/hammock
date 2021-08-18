import { ReactNode, useMemo } from 'react';
import cn from 'classnames';

import NavBar from 'components/nav-bar';

import breakpoints from 'lib/breakpoints';
import { caps } from 'lib/utils';
import useNow from 'lib/hooks/now';
import { useUser } from 'lib/context/user';

export interface LayoutProps {
  children: ReactNode;
  spacer?: boolean;
}

export default function Layout({ children, spacer }: LayoutProps): JSX.Element {
  const { user } = useUser();
  const now = useNow();
  const title = useMemo(() => {
    if (!user?.name) return '';
    const hourOfDay = now.getHours();
    const firstName = caps(user.name.split(' ')[0] || '');
    if (hourOfDay < 12) return `Good morning, ${firstName}`;
    if (hourOfDay < 18) return `Good afternoon, ${firstName}`;
    return `Good evening, ${firstName}`;
  }, [now, user]);

  return (
    <div className='page'>
      <NavBar />
      <div className='wrapper'>
        {spacer && <div className='spacer' />}
        <header>
          <h1 className={cn('nowrap', { loading: !title })}>{title}</h1>
        </header>
        {children}
      </div>
      <style jsx>{`
        .page {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          max-width: 948px;
          padding: 0 24px;
          margin: 96px auto;
        }

        .wrapper {
          flex: 1 1 auto;
          max-width: 700px;
          margin-left: 24px;
          width: 0;
        }

        .wrapper :global(.empty) {
          height: 400px;
        }

        .spacer {
          height: 96px;
          width: 100vw;
          background: var(--background);
          position: fixed;
          z-index: 2;
          left: 0;
          top: 0;
        }

        header > h1 {
          font-size: 48px;
          font-weight: 400;
          line-height: 64px;
          height: 64px;
          margin: -12px 0 48px;
          position: relative;
          color: var(--accents-6);
          z-index: 3;
        }

        header > h1.loading {
          border-radius: 6px;
          max-width: 500px;
        }

        @media (max-width: ${breakpoints.mobile}) {
          .page {
            flex-direction: column;
            margin: 0 auto 96px;
          }

          .wrapper {
            flex: unset;
            max-width: unset;
            margin-left: unset;
            width: unset;
          }

          .spacer {
            display: none;
          }

          header {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
