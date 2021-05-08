import Link from 'next/link';
import cn from 'classnames';
import { useRouter } from 'next/router';

import Avatar from 'components/avatar';

import { useUser } from 'lib/context/user';

export interface NavButtonProps {
  onClick: () => void;
  children: string;
}

export function NavButton({ onClick, children }: NavButtonProps): JSX.Element {
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

export interface NavLinkProps {
  href: string;
  children: string;
}

export function NavLink({ href, children }: NavLinkProps): JSX.Element {
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

  return (
    <div className='wrapper'>
      <div className='content'>
        <Avatar loading={!loggedIn} src={user.photo} size={48} />
        <nav>
          <NavLink href='/'>Feed</NavLink>
          <NavLink href='/quick-read'>Quick read</NavLink>
          <NavLink href='/resume'>Resume</NavLink>
          <NavLink href='/highlights'>Highlights</NavLink>
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
          top: 96px;
        }

        nav {
          margin-top: 120px;
        }
      `}</style>
    </div>
  );
}
