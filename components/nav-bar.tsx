import { useCallback, useState } from 'react';
import Link from 'next/link';
import cn from 'classnames';
import { mutate } from 'swr';
import { useRouter } from 'next/router';

import Avatar from 'components/avatar';

import { User } from 'lib/model/user';
import { useUser } from 'lib/context/user';

interface NavButtonProps {
  onClick: () => void;
  children: string;
}

function NavButton({ onClick, children }: NavButtonProps): JSX.Element {
  return (
    <button type='button' onClick={onClick}>
      {children}
      <style jsx>{`
        button {
          transition: color 0.2s ease 0s;
          color: var(--accents-5);
          text-decoration: none;
          cursor: pointer;
          font-size: 18px;
          font-weight: 400;
          font-family: var(--font-sans);
          line-height: 24px;
          height: 24px;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          margin: 16px 0;
          display: block;
          background: unset;
          text-align: unset;
          padding: unset;
          border: unset;
          width: 100%;
        }

        button:hover {
          color: var(--on-background);
        }
      `}</style>
    </button>
  );
}

interface NavLinkProps {
  href: string;
  children: string;
}

function NavLink({ href, children }: NavLinkProps): JSX.Element {
  const { pathname } = useRouter();

  return (
    <Link href={href}>
      <a className={cn({ active: pathname === href })}>
        {children}
        <style jsx>{`
          a {
            transition: color 0.2s ease 0s;
            color: var(--accents-5);
            text-decoration: none;
            cursor: pointer;
            font-size: 18px;
            font-weight: 400;
            line-height: 24px;
            height: 24px;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            margin: 16px 0;
            display: block;
          }

          a:not(.active):hover {
            color: var(--on-background);
          }

          a.active {
            cursor: not-allowed;
            font-weight: 700;
          }
        `}</style>
      </a>
    </Link>
  );
}

export default function NavBar(): JSX.Element {
  const { loggedIn, user } = useUser();

  const [loggingOut, setLoggingOut] = useState<boolean>(false);
  const logout = useCallback(async () => {
    setLoggingOut(true);
    const { default: firebase } = await import('lib/firebase');
    await import('firebase/auth');
    await firebase.auth().signOut();
    await mutate('/api/account', new User());
  }, []);

  return (
    <div className='wrapper'>
      <div className='content'>
        <Avatar loading={!loggedIn} src={user.photo} size={48} />
        <nav>
          <NavLink href='/'>Feed</NavLink>
          <NavLink href='/letters'>Letters</NavLink>
          <NavButton onClick={logout}>
            {loggingOut ? 'Logging out...' : 'Logout'}
          </NavButton>
        </nav>
      </div>
      <style jsx>{`
        .wrapper {
          flex: none;
          width: 120px;
          margin-right: 24px;
        }

        .content {
          position: sticky;
          margin-top: 12px;
          top: 48px;
        }

        nav {
          margin-top: 156px;
        }
      `}</style>
    </div>
  );
}
