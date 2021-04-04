import { ReactNode, useCallback, useEffect, useState } from 'react';
import NProgress from 'nprogress';
import Router from 'next/router';
import { mutate } from 'swr';

import GoogleIcon from 'components/icons/google';
import LockIcon from 'components/icons/lock';
import Page from 'components/page';
import SyncIcon from 'components/icons/sync';
import UndoIcon from 'components/icons/undo';

import { User } from 'lib/model/user';
import { fetcher } from 'lib/fetch';
import { period } from 'lib/utils';
import usePage from 'lib/hooks/page';

interface SectionProps {
  icon: ReactNode;
  header: string;
  children: string;
}

function Section({ icon, header, children }: SectionProps): JSX.Element {
  return (
    <div className='section'>
      <div className='icon'>{icon}</div>
      <div className='content'>
        <h2>{header}</h2>
        <p>{children}</p>
      </div>
      <style jsx>{`
        .section {
          display: flex;
          flex-direction: row;
          align-items: center;
          margin: 32px 0;
        }

        .icon {
          background: var(--accents-2);
          border-radius: 100%;
          padding: 12px;
          height: 48px;
          width: 48px;
          flex: none;
        }

        .content {
          margin-left: 24px;
        }

        h2 {
          color: var(--on-background);
          line-height: 20px;
          font-size: 16px;
          font-weight: 700;
          margin: 0 0 8px;
        }

        p {
          color: var(--on-background);
          line-height: 16px;
          font-size: 14px;
          font-weight: 400;
          margin: 0;
        }
      `}</style>
    </div>
  );
}

interface ButtonProps {
  disabled?: boolean;
  onClick?: () => void;
  children: string;
}

function Button({ disabled, onClick, children }: ButtonProps): JSX.Element {
  return (
    <button type='button' onClick={onClick} disabled={disabled}>
      <div className='google'>
        <GoogleIcon />
      </div>
      {children}
      <style jsx>{`
        button {
          --border-color: var(--primary);
          width: 100%;
          border: 2px solid var(--border-color);
          background: var(--primary);
          color: var(--on-primary);
          border-radius: 6px;
          position: relative;
          height: 50px;
          text-align: center;
          font-size: 16px;
          font-weight: 600;
          font-family: var(--font-sans);
          transition: all 0.2s ease 0s;
          cursor: pointer;
          display: block;
          padding: 0;
          margin: 0;
        }

        button:disabled {
          --border-color: var(--accents-2);
          cursor: not-allowed;
          background: var(--accents-1);
          border-color: var(--border-color);
          color: var(--accents-4);
          filter: grayscale(1);
          transform: translateZ(0px);
          backface-visibility: hidden;
        }

        button:not(:disabled):hover,
        button:not(:disabled):focus,
        button:not(:disabled):active,
        button:not(:disabled):focus-within {
          --border-color: var(--primary);
          color: var(--primary);
          background: var(--on-primary);
          border-color: var(--border-color);
        }

        button > .google {
          position: absolute;
          background: #fff;
          border-top-left-radius: 4px;
          border-bottom-left-radius: 4px;
          border-right: 2px solid var(--border-color);
          transition: all 0.2s ease 0s;
          padding: 3px;
          height: 46px;
          width: 48px;
          left: 0;
          top: 0;
        }

        @media (max-width: 450px) {
          button {
            padding-left: 46px;
          }
        }
      `}</style>
    </button>
  );
}
export default function LoginPage(): JSX.Element {
  usePage({ name: 'Login' });

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

  const onClick = useCallback(async () => {
    setLoading(true);
    try {
      const { default: firebase } = await import('lib/firebase');
      await import('firebase/auth');

      const provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/gmail.modify');
      provider.addScope('https://www.googleapis.com/auth/gmail.settings.basic');
      provider.addScope('https://www.googleapis.com/auth/gmail.labels');
      const cred = await firebase.auth().signInWithPopup(provider);

      if (!cred.user) throw new Error('Did not receive user information');

      const user = new User({
        id: cred.user.uid,
        name: cred.user.displayName || '',
        photo: cred.user.photoURL || '',
        email: cred.user.email || '',
        phone: cred.user.phoneNumber || '',
        token: (cred.credential as any)?.accessToken,
      });

      const url = '/api/account';
      await mutate(url, user.toJSON(), false);
      await mutate(url, fetcher(url, 'patch', user.toJSON()));
      await Router.push('/letters');
    } catch (e) {
      setError(`Hmm, it looks like we hit a snag. ${period(e.message)}`);
    }
  }, []);

  return (
    <Page title='Login - Return of the Newsletter'>
      <div className='wrapper'>
        <div className='dialog'>
          <h1>First, let’s get a few things straight...</h1>
          <div className='line' />
          <Section icon={<SyncIcon />} header='Syncs with your Gmail'>
            You won’t need to get a new email address or subscribe to all your
            newsletters again.
          </Section>
          <Section
            icon={<LockIcon />}
            header='We don’t read your email, promise'
          >
            We’ll request a few Gmail permissions next to help us organize your
            newsletters. Nothing else.
          </Section>
          <Section icon={<UndoIcon />} header='Your newsletters are yours'>
            You can always go back to reading them in your inbox, we won’t be
            offended.
          </Section>
          <div className='actions'>
            <Button disabled={loading} onClick={onClick}>
              Continue signing in
            </Button>
            {error && <p className='error'>{error}</p>}
          </div>
        </div>
        <div className='scrim' />
        <style jsx>{`
          h1 {
            color: var(--accents-5);
            line-height: 32px;
            font-size: 24px;
            font-weight: 700;
            margin: 48px 0 24px;
          }

          .line {
            border-top: 1px solid var(--accents-2);
            margin: 24px 0 48px;
          }

          .actions {
            margin: 48px 0;
          }

          .error {
            color: var(--error);
            line-height: 14px;
            font-size: 12px;
            font-weight: 500;
            margin: 12px 0 48px;
          }

          .wrapper {
            position: fixed;
            top: 0;
            left: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            z-index: 7;
          }

          .dialog {
            max-width: 500px;
            max-height: calc(100% - 32px);
            background: var(--background);
            border-radius: 12px;
            box-shadow: var(--shadow-large);
            overflow: auto;
            padding: 0 48px;
          }

          .scrim {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
            background: rgba(0, 0, 0, 0.32);
            opacity: 1;
          }

          @media (max-width: 500px) {
            .dialog {
              box-shadow: none;
            }

            .scrim {
              display: none;
            }
          }

          @media (max-width: 450px) {
            .dialog {
              padding: 0 24px;
            }
          }
        `}</style>
      </div>
    </Page>
  );
}
