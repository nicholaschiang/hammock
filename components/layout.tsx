import { ReactNode, useMemo } from 'react';
import cn from 'classnames';

import NavBar from 'components/nav-bar';

import useNow from 'lib/hooks/now';
import { useUser } from 'lib/context/user';

export interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps): JSX.Element {
  const { user } = useUser();
  const now = useNow();
  const title = useMemo(() => {
    if (!user.firstName) return '';
    const hourOfDay = now.getHours();
    if (hourOfDay < 12) return `Good morning, ${user.firstName}`;
    if (hourOfDay < 18) return `Good afternoon, ${user.firstName}`;
    return `Good evening, ${user.firstName}`;
  }, [now, user.firstName]);
  
  return (
    <div className='page'>
      <NavBar />
      <div className='wrapper'>
        <div className='spacer' />
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
          max-width: 1048px;
          padding: 0 48px;
          margin: 96px auto;
        }
        
        .wrapper {
          flex: 1 1 auto;
          max-width: 720px;
          margin: 0 24px;
          width: 0;
        }

        .wrapper > :global(.empty) {
          height: 400px;
        }
        
        .wrapper > :global(button) {
          width: 100%;
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
          margin: -12px 0 72px;
          position: relative;
          z-index: 3;
        }

        header > h1.loading {
          border-radius: 6px;
          max-width: 500px;
        }
      `}</style>
    </div>
  );
}
