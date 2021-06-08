import { ReactNode, useCallback, useEffect, useState } from 'react';
import NProgress from 'nprogress';
import Router from 'next/router';

import Button from 'components/button';
import Dialog from 'components/dialog';
import LockIcon from 'components/icons/lock';
import Page from 'components/page';
import SyncIcon from 'components/icons/sync';
import UndoIcon from 'components/icons/undo';

import { period } from 'lib/utils';

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

export default function LoginPage(): JSX.Element {
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
      window?.analytics.track('Login Started');
      // TODO: This API request isn't really necessary. I'm pretty sure that the
      // login link won't be changing anytime soon, so we should be able to just
      // hardcode this into the front-end or as an environment variable.
      // See: https://github.com/googleapis/google-auth-library-nodejs/blob/241063a8c7d583df53ae616347edc532aec02165/src/auth/oauth2client.ts#L522
      const link = await fetch('/api/login', { method: 'options' });
      await Router.push(await link.text());
    } catch (e) {
      window?.analytics.track('Login Errored', period(e.message));
      setError(`Hmm, it looks like we hit a snag. ${period(e.message)}`);
    }
  }, []);

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
          {error && <p className='error'>{error}</p>}
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
