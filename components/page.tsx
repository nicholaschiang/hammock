import { ReactNode, useEffect } from 'react';
import Head from 'next/head';
import Router from 'next/router';

import { useUser } from 'lib/context/user';
import segmentSnippet from 'lib/segment-snippet';

export interface PageProps {
  name: string;
  sync?: boolean;
  login?: boolean;
  children: ReactNode;
}

export default function Page({ name, sync, login, children }: PageProps): JSX.Element {
  // Scrappy fix to sync the user's Gmail with our database when they login.
  // @see {@link https://github.com/readhammock/hammock/issues/38}
  useEffect(() => {
    if (!sync) return;
    void fetch('/api/sync');
  }, [sync]);

  // Redirect to the login page if authentication is required but missing.
  const { loggedIn } = useUser();
  useEffect(() => {
    if (!login) return;
    void Router.prefetch('/login');
  }, [login]);
  useEffect(() => {
    if (!login || loggedIn || loggedIn === undefined) return;
    void Router.replace('/login');
  }, [login, loggedIn]);

  // Log the analytics page event specifying a name for easier grouping (e.g. it
  // is practically impossible to identify a page by dynamic URL alone).
  useEffect(() => {
    window.analytics?.page('', name);
  }, [name]);
  
  return (
    <>
      <Head>
        <title>{`${name} - Hammock`}</title>
        <meta
          name='description'
          content='A place where you can enjoy reading and learning from newsletters. So you spend less time in your inbox.'
        />
        <meta charSet='UTF-8' />
        <meta name='viewport' content='width=device-width,initial-scale=1.0' />
        <meta property='og:type' content='website' />
        <meta property='og:title' content='Hammock App - Newsletter Reader' />
        <meta
          property='og:description'
          content='A place where you can enjoy reading and learning from newsletters. So you spend less time in your inbox.'
        />
        <meta
          property='og:image'
          content='https://hammock.vercel.app/images/hammock-app.png'
        />
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:site' content='@readhammock' />
        <meta
          property='twitter:title'
          content='Hammock App - Newsletter Reader'
        />
        <meta
          property='twitter:description'
          content='A place where you can enjoy reading and learning from newsletters. So you spend less time in your inbox.'
        />
        <meta
          property='twitter:image'
          content='https://hammock.vercel.app/images/hammock-app.png'
        />
        <link
          rel='shortcut icon'
          href='/images/favicon.png'
          type='image/x-icon'
        />
        <link rel='apple-touch-icon' href='/images/webclip.png' />
        <link rel='preconnect' href='https://cdn.segment.com' />
        <link rel='preconnect' href='https://api.segment.io' />
        <link rel='preconnect' href='https://fonts.gstatic.com' />
        <link
          href='https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'
          rel='stylesheet'
        />
        <script dangerouslySetInnerHTML={{ __html: segmentSnippet }} />
        <link rel='preload' href='/api/account' as='fetch' />
      </Head>
      {children}
    </>
  );
}
