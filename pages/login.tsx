import { ReactNode, useCallback, useEffect } from 'react';
import { signIn } from 'next-auth/client';
import { useRouter } from 'next/router';

import Button from 'components/button';
import Dialog from 'components/dialog';
import LockIcon from 'components/icons/lock';
import Page from 'components/page';
import SyncIcon from 'components/icons/sync';
import UndoIcon from 'components/icons/undo';

import { useLoading } from 'lib/nprogress';

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
          padding: 12px;
          height: 48px;
          width: 48px;
          flex: none;
        }

        .content {
          margin-left: 24px;
        }

        h2 {
          line-height: 20px;
          font-size: 16px;
          font-weight: 700;
          margin: 0 0 6px;
        }

        p {
          line-height: 16px;
          font-size: 14px;
          font-weight: 400;
          margin: 0;
        }
      `}</style>
    </div>
  );
}

// Next.js auth error codes and their corresponding user-facing messages.
// @see {@link https://git.io/JZ3q4}
const errors: Record<string, string> = {
  Signin: 'Try signing with a different account.',
  OAuthSignin: 'Try signing with a different account.',
  OAuthCallback: 'Try signing with a different account.',
  OAuthCreateAccount: 'Try signing with a different account.',
  EmailCreateAccount: 'Try signing with a different account.',
  Callback: 'Try signing with a different account.',
  OAuthAccountNotLinked: 'To confirm your identity, sign in with the same account you used originally.',
  EmailSignin: 'Check your email address.',
  CredentialsSignin: 'Sign in failed. Check the details you provided are correct.',
  default: 'Unable to sign in.'
};

export default function LoginPage(): JSX.Element {
  // Next.js passes the error code to our custom `signIn` and `error` page.
  // @see {@link https://next-auth.js.org/configuration/pages}
  const { query } = useRouter();
  const { loading, setLoading, error, setError } = useLoading();
  useEffect(() => {
    setError((prev) => {
      if (typeof query.error !== 'string') return prev;
      return errors[query.error] || 'An unexpected error occurred.';
    });
  }, [setError, query.error]);
  const onClick = useCallback(async () => {
    setLoading(true);
    await signIn('google', { callbackUrl: '/feed' });
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
          {error && <p className='error'>Hmm, it looks like we hit a snag. {error}</p>}
        </div>
        <style jsx>{`
          h1 {
            color: var(--accents-5);
            line-height: 24px;
            font-size: 20px;
            font-weight: 700;
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
            line-height: 14px;
            font-size: 12px;
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
