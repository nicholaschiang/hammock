import { ReactNode, useCallback, useEffect } from 'react';
import { signIn } from 'next-auth/client';
import { useRouter } from 'next/router';

import Button from 'components/button';
import LockIcon from 'components/icons/lock';
import Page from 'components/page';
import SyncIcon from 'components/icons/sync';
import UndoIcon from 'components/icons/undo';

import { SCOPES } from 'lib/model/user';
import useLoading from 'lib/hooks/loading';

interface DialogProps {
  children: ReactNode;
}

// TODO: Reduce code duplication between this and the subscription page.
function Dialog({ children }: DialogProps): JSX.Element {
  return (
    <div className='wrapper'>
      <header>
        We released some improvements to make Hammock faster and more stable.
        Please log back in to use the latest version.{' '}
        <a href='/changelog' target='_blank' rel='noopener noreferrer'>
          Full changelog
        </a>
        .
      </header>
      <div className='dialog'>{children}</div>
      <div className='scrim' />
      <style jsx>{`
        header {
          background: var(--primary);
          color: var(--on-primary);
          padding: 8px 48px;
          text-align: center;
          line-height: 1.2;
        }

        header a {
          color: unset;
        }

        .wrapper {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
          overflow: auto;
        }

        .dialog {
          max-width: 540px;
          background: var(--background);
          border-radius: 10px;
          box-shadow: var(--shadow-large);
          position: relative;
          overflow: auto;
          padding: 0 48px;
          margin: 48px auto;
          position: relative;
        }

        .scrim {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: -1;
          background-color: rgba(0, 0, 0, 0.32);
          backdrop-filter: blur(2px);
          opacity: 1;
        }

        @media (max-width: 540px) {
          .wrapper {
            background: var(--background);
          }

          .dialog {
            box-shadow: none;
            margin: 0;
          }

          .scrim {
            display: none;
          }
        }

        @media (max-width: 450px) {
          .dialog {
            padding: 0 24px;
          }

          header {
            padding: 8px 24px;
          }

          h1 {
            margin-top: 24px;
          }
        }
      `}</style>
    </div>
  );
}

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
          margin: 36px 0;
        }

        .icon {
          background: var(--accents-2);
          border-radius: 100%;
          padding: 1rem;
          height: calc(24px + 2rem);
          width: calc(24px + 2rem);
          flex: none;
        }

        .icon > :global(svg) {
          fill: var(--accents-6);
        }

        .content {
          margin-left: 24px;
        }

        h2 {
          font-size: 1rem;
          font-weight: 600;
          line-height: 1.35;
          margin: 0 0 6px;
        }

        p {
          margin: 0;
        }
      `}</style>
    </div>
  );
}

// Next.js auth error codes and their corresponding user-facing messages.
// @see {@link https://git.io/JZ3q4}
const ERRORS: Record<string, string> = {
  Signin: 'Try signing in with a different account.',
  OAuthSignin: 'Try signing in with a different account.',
  OAuthCallback: 'Try signing in with a different account.',
  OAuthCreateAccount: 'Try signing in with a different account.',
  EmailCreateAccount: 'Try signing in with a different account.',
  Callback: 'Try signing in with a different account.',
  OAuthAccountNotLinked:
    'To confirm your identity, sign in with the same account you used originally.',
  EmailSignin: 'Check your email address.',
  CredentialsSignin:
    'Sign in failed. Check the details you provided are correct.',
  default: 'Unable to sign in.',
};

const SCOPE_ERRORS: Record<keyof typeof SCOPES, string> = {
  EMAIL:
    'To function correctly, Hammock needs to know your email address. Please login again.',
  PROFILE:
    'To function correctly, Hammock needs to view your Google profile. Please login again.',
  READ: 'To fetch your newsletters, Hammock needs to view your email messages. We never store any message content; your emails remain safely in Gmail. Please login again and grant Hammock read-only access to Gmail.',
  LABEL:
    'To create the “Hammock” label, Hammock needs to edit your email labels. Please login again and grant Hammock edit access to Gmail’s labels.',
  FILTER:
    'To automatically filter new newsletters into the “Hammock” label, Hammock needs to edit your email settings. Please login again and grant Hammock edit access to Gmail’s settings.',
};

export default function LoginPage(): JSX.Element {
  // Next.js passes the error code to our custom `signIn` and `error` page.
  // @see {@link https://next-auth.js.org/configuration/pages}
  const { query } = useRouter();
  const { loading, setLoading, error, setError } = useLoading();
  useEffect(() => {
    setError((prev) => {
      if (typeof query.error !== 'string') return prev;
      return (
        ERRORS[query.error] ||
        SCOPE_ERRORS[query.error as keyof typeof SCOPES] ||
        'An unexpected error occurred.'
      );
    });
  }, [setError, query.error]);
  const onClick = useCallback(async () => {
    setLoading(true);
    await signIn('google', { callbackUrl: '/api/login?redirect=true' });
  }, [setLoading]);

  return (
    <Page name='Login'>
      <Dialog>
        <h1>A few things to know, before we get started</h1>
        <div className='line' />
        <Section icon={<SyncIcon />} header='Syncs with your Gmail'>
          You won’t need to get a new email address or subscribe to all your
          newsletters again.
        </Section>
        <Section icon={<LockIcon />} header='We don’t read your email, promise'>
          We’ll request a few Gmail permissions to help us organize your
          newsletters. Nothing else.
        </Section>
        <Section icon={<UndoIcon />} header='Your newsletters are yours'>
          You can always go back to reading them in your inbox; we won’t be
          offended.
        </Section>
        <div className='actions'>
          <Button disabled={loading} onClick={onClick} google>
            Continue signing in
          </Button>
          {error && (
            <p className='error' data-cy='error'>
              Hmm, it looks like we hit a snag. {error}
            </p>
          )}
        </div>
        <style jsx>{`
          h1 {
            color: var(--accents-6);
            font-size: 1.25rem;
            font-weight: 600;
            line-height: 1.35;
            margin: 48px 0 24px;
          }

          .line {
            border-top: 2px solid var(--accents-2);
            margin: 24px 0 48px;
          }

          .actions {
            margin: 48px 0;
          }

          .actions > :global(button) {
            width: 100%;
          }

          .error {
            color: var(--error);
            font-size: 0.75rem;
            font-weight: 500;
            margin-top: 12px;
          }

          @media (max-width: 450px) {
            .actions {
              margin-bottom: 24px;
            }
          }
        `}</style>
      </Dialog>
    </Page>
  );
}
