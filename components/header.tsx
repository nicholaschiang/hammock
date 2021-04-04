import { ReactNode, useCallback, useState } from 'react';
import Link from 'next/link';
import cn from 'classnames';
import { mutate } from 'swr';

import Avatar from 'components/avatar';

import { Callback } from 'lib/model/callback';
import { User } from 'lib/model/user';
import useClickOutside from 'lib/hooks/click-outside';
import { useUser } from 'lib/context/user';

function Triangle() {
  return (
    <svg width='24' height='12' viewBox='0 0 24 12'>
      <path
        fill='var(--background)'
        strokeWidth='1px'
        stroke='var(--triangle-stroke)'
        fillRule='evenodd'
        d='M20 12l-8-8-12 12'
      />
    </svg>
  );
}

function Line() {
  return (
    <div className='line'>
      <style jsx>{`
        .line {
          border-top: 1px solid var(--accents-2);
          margin: 8px 0;
        }
      `}</style>
    </div>
  );
}

interface ItemProps {
  href?: string;
  onClick?: () => void;
  children: string;
}

function Item({ href, onClick, children }: ItemProps): JSX.Element {
  return (
    <div className='item'>
      {href && (
        <Link href={href}>
          <a>{children}</a>
        </Link>
      )}
      {onClick && (
        <button className='reset' type='button' onClick={onClick}>
          {children}
        </button>
      )}
      <style jsx>{`
        .item {
          position: relative;
          font-size: 14px;
          color: var(--accents-5);
          line-height: 20px;
          transition: color 0.1s ease 0s, background 0.1s ease 0s;
          max-width: 100%;
        }

        .item > a {
          color: currentcolor;
          display: flex;
          align-items: center;
          text-decoration: none;
          padding: 8px 20px;
        }

        .item:not(.disabled):hover {
          background: var(--accents-1);
          color: var(--on-background);
        }

        button {
          width: 100%;
          height: 100%;
          padding: 8px 20px;
          color: currentcolor;
        }
      `}</style>
    </div>
  );
}

interface PopOverProps {
  children: ReactNode;
  open: boolean;
  setOpen: Callback<boolean>;
}

function PopOver({ children, open, setOpen }: PopOverProps): JSX.Element {
  const [loggingOut, setLoggingOut] = useState<boolean>(false);
  const logout = useCallback(async () => {
    setLoggingOut(true);
    const { default: firebase } = await import('lib/firebase');
    await import('firebase/auth');
    await firebase.auth().signOut();
    await mutate('/api/account', new User());
  }, []);

  const onClickOutside = useCallback(() => setOpen(false), [setOpen]);
  const { updateEl, removeEl } = useClickOutside(onClickOutside, true);
  const innerRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return removeEl('pop-over-menu');
      return updateEl('pop-over-menu', node);
    },
    [updateEl, removeEl]
  );

  return (
    <div className={cn('details', { open })}>
      <div className='summary'>{children}</div>
      <div className='menu' role='menu' aria-hidden={!open}>
        {open && (
          <div ref={innerRef} className='inner'>
            <div className='popover'>
              <div className='triangle'>
                <Triangle />
              </div>
              <div className='list'>
                <Item href='/'>Dashboard</Item>
                <Item href='/letters'>Letters</Item>
                <Line />
                <Item onClick={logout}>
                  {loggingOut ? 'Logging out...' : 'Logout'}
                </Item>
              </div>
            </div>
          </div>
        )}
      </div>
      <style jsx>{`
        .details {
          display: inline-flex;
          position: relative;
        }

        .details.open > .summary::before {
          content: '';
          background: transparent;
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          cursor: default;
          z-index: 1;
        }

        .summary {
          display: inline-flex;
          list-style: none;
          outline: none;
          max-width: 100%;
        }

        .details.open > .menu {
          position: absolute;
          top: 100%;
          left: 100%;
          z-index: 2;
          opacity: 0;
          animation: popOverFadeIn 0.1s ease-in forwards;
        }

        .list {
          color: var(--on-background);
          display: inline-block;
          text-align: left;
          background: var(--background);
          max-width: 100vw;
          box-shadow: var(--shadow-medium);
          border-radius: 5px;
          margin-top: 11px;
          width: 225px;
          min-width: auto;
          padding: 8px 0;
          overflow: visible;
        }

        .inner {
          position: absolute;
          transform: translate(-100%);
        }

        .popover {
          display: inline-block;
          position: relative;
        }

        .triangle {
          top: -1px;
          left: 198px;
          text-align: left;
          display: block;
          line-height: 11px;
          z-index: 1;
          position: absolute;
        }

        @keyframes popOverFadeIn {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 100%;
          }
        }
      `}</style>
    </div>
  );
}

export default function Header() {
  const { user } = useUser();

  const [open, setOpen] = useState(false);

  return (
    <div className='wrapper'>
      <header>
        <div />
        <PopOver open={open} setOpen={setOpen}>
          <button
            aria-expanded='true'
            aria-haspopup='true'
            className='reset'
            id='options-menu'
            onClick={() => setOpen((prev) => !prev)}
            type='button'
          >
            <Avatar src={user.photo} size={30} />
          </button>
        </PopOver>
      </header>
      <style jsx>{`
        div.wrapper {
          position: sticky;
          top: 0;
          width: 100%;
          max-width: 100%;
          display: flex;
          justify-content: center;
          background: var(--header-background);
          border-bottom: 1px solid var(--accents-2);
          z-index: 4;
        }

        header {
          height: 30px;
          width: var(--page-width);
          padding: 16px var(--page-padding);
          justify-content: space-between;
          display: flex;
          margin: auto;
        }
      `}</style>
    </div>
  );
}
