import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import Router, { useRouter } from 'next/router';
import Link from 'next/link';
import cn from 'classnames';
import { signOut } from 'next-auth/client';

import Avatar from 'components/avatar';
import DarkIcon from 'components/icons/dark';
import LightIcon from 'components/icons/light';
import Select from 'components/select';
import SystemIcon from 'components/icons/system';

import { useTheme } from 'lib/context/theme';
import { useUser } from 'lib/context/user';

interface MenuButtonProps {
  onClick: () => void;
  disabled?: boolean;
  children: string;
}

function MenuButton({
  onClick,
  disabled,
  children,
}: MenuButtonProps): JSX.Element {
  return (
    <button disabled={disabled} type='button' onClick={onClick}>
      {children}
      <style jsx>{`
        button {
          width: 100%;
          border: unset;
          margin: unset;
          font: unset;
          text-align: unset;
          appearance: unset;
          cursor: pointer;
          padding: 12px 36px 12px 24px;
          color: var(--on-background);
          background: var(--background);
          transition: background 0.2s ease 0s;
          font-size: 16px;
          font-weight: 400;
        }

        button:hover {
          background: var(--accents-2);
        }

        button.disabled {
          cursor: not-allowed;
        }
      `}</style>
    </button>
  );
}

interface LinkProps {
  href: string;
  children: string;
}

function NavLink({ href, children }: LinkProps): JSX.Element {
  const { pathname } = useRouter();

  return (
    <Link href={href}>
      <a className={cn('nowrap', { active: pathname === href })}>
        {children}
        <style jsx>{`
          a {
            transition: color 0.2s ease 0s;
            color: var(--accents-5);
            text-decoration: none;
            cursor: pointer;
            font-size: 18px;
            font-weight: 400;
            height: 24px;
            margin: 16px 0;
            display: block;
          }

          a:not(.active):hover {
            color: var(--on-background);
          }

          a.active {
            cursor: not-allowed;
            font-weight: 600;
          }
        `}</style>
      </a>
    </Link>
  );
}

function MenuLink({ href, children }: LinkProps): JSX.Element {
  const { pathname } = useRouter();

  return (
    <Link href={href}>
      <a
        rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
        target={href.startsWith('http') ? '_blank' : undefined}
        className={cn('nowrap', { active: pathname === href })}
      >
        {children}
        <style jsx>{`
          a {
            display: block;
            padding: 12px 36px 12px 24px;
            background: var(--background);
            transition: background 0.2s ease 0s;
            color: var(--on-background);
            text-decoration: none;
            cursor: pointer;
            font-size: 16px;
            font-weight: 400;
            line-height: 1;
          }

          a:hover {
            background: var(--accents-2);
          }

          a.active {
            cursor: not-allowed;
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
    await signOut({ redirect: false });
    await Router.push('/login');
  }, []);

  const [open, setOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    function nodeInRefs(node: Node, refs: RefObject<HTMLElement>[]): boolean {
      return refs.some(
        (ref) =>
          !ref.current || ref.current === node || ref.current.contains(node)
      );
    }
    function onClick({ target }: MouseEvent | TouchEvent): void {
      if (!nodeInRefs(target as Node, [menuRef, buttonRef])) setOpen(false);
    }
    document.body.addEventListener('mousedown', onClick);
    document.body.addEventListener('touchstart', onClick);
    return () => {
      document.body.removeEventListener('mousedown', onClick);
      document.body.removeEventListener('touchstart', onClick);
    };
  }, []);

  const { theme, setTheme } = useTheme();

  return (
    <div className='wrapper'>
      <div className='content'>
        <button
          onClick={() => setOpen((prev) => !prev)}
          className='reset avatar'
          ref={buttonRef}
          type='button'
        >
          <Avatar loading={!loggedIn} src={user.photo} size={48} />
        </button>
        <div ref={menuRef} className={cn('menu', { open })}>
          <MenuLink href='/subscriptions'>Subscriptions</MenuLink>
          <MenuLink href='/archive'>Archive</MenuLink>
          <div className='line' />
          <MenuLink href='https://www.notion.so/readhammock/Help-Support-9b6bb1da1d6d4887ad3631f32d7741de'>
            Help
          </MenuLink>
          <MenuLink href='/about'>About</MenuLink>
          <MenuLink href='https://form.typeform.com/to/oTBbAI6z'>
            Send feedback
          </MenuLink>
          <div className='line' />
          <Select
            small
            value={theme}
            onChange={setTheme}
            label='Change color theme'
            options={[
              {
                value: 'system',
                label: 'System',
                icon: <SystemIcon />,
              },
              {
                value: 'dark',
                label: 'Dark',
                icon: <DarkIcon />,
              },
              {
                value: 'light',
                label: 'Light',
                icon: <LightIcon />,
              },
            ]}
          />
          <div className='line' />
          <MenuButton onClick={logout}>
            {loggingOut ? 'Logging out...' : 'Logout'}
          </MenuButton>
        </div>
        <nav>
          <NavLink href='/feed'>Feed</NavLink>
          <NavLink href='/writers'>Writers</NavLink>
          <NavLink href='/quick-read'>Quick read</NavLink>
          <NavLink href='/resume'>Resume</NavLink>
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
          z-index: 4;
          top: 96px;
        }

        .menu {
          pointer-events: none;
          transform: translateX(-50%);
          position: absolute;
          top: 60px;
          left: 24px;
          opacity: 0;
          padding: 4px 0;
          overflow: hidden;
          border-radius: 8px;
          background: var(--background);
          box-shadow: var(--shadow-medium);
          transition: top 0.2s ease 0s, opacity 0.2s ease 0s;
        }

        .menu.open {
          pointer-events: unset;
          top: 72px;
          opacity: 1;
        }

        .menu .line {
          border-top: 1px solid var(--accents-2);
          margin: 4px 0;
        }

        .menu :global(.select) {
          margin: 12px;
        }

        nav {
          margin-top: 120px;
        }
      `}</style>
    </div>
  );
}
