import { ReactNode, useEffect, useState } from 'react';
import Head from 'next/head';
import Router from 'next/router';

import segmentSnippet from 'lib/segment-snippet';
import { useTheme } from 'lib/context/theme';
import { useUser } from 'lib/context/user';

export interface PageProps {
  name: string;
  title?: string;
  sync?: boolean;
  login?: boolean;
  children: ReactNode;
}

export default function Page({
  name,
  title,
  sync,
  login,
  children,
}: PageProps): JSX.Element {
  // Redirect to the login page if authentication is required but missing.
  const { loggedIn, user } = useUser();
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

  // Redirect to the subscriptions page if the user doesn't have any selected.
  useEffect(() => {
    if (!sync || !loggedIn || user?.subscriptions.length) return;
    void Router.replace('/subscriptions');
  }, [sync, loggedIn, user?.subscriptions.length]);

  // Change the web app manifest colors based on the user's theme.
  // @see {@link https://stackoverflow.com/a/57760135/10023158}
  const { theme } = useTheme();
  const [dark, setDark] = useState<boolean>(theme === 'dark');
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)');
    setDark(theme === 'dark' || (theme === 'system' && mq.matches));
  }, [theme]);

  return (
    <>
      <Head>
        <title>{title || `${name} - Hammock`}</title>
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
        <meta property='og:image' content='/images/hammock-app.png' />
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
        <meta property='twitter:image' content='/images/hammock-app.png' />
        <link
          rel='apple-touch-icon'
          sizes='57x57'
          href='/apple-icon-57x57.png'
        />
        <link
          rel='apple-touch-icon'
          sizes='60x60'
          href='/apple-icon-60x60.png'
        />
        <link
          rel='apple-touch-icon'
          sizes='72x72'
          href='/apple-icon-72x72.png'
        />
        <link
          rel='apple-touch-icon'
          sizes='76x76'
          href='/apple-icon-76x76.png'
        />
        <link
          rel='apple-touch-icon'
          sizes='114x114'
          href='/apple-icon-114x114.png'
        />
        <link
          rel='apple-touch-icon'
          sizes='120x120'
          href='/apple-icon-120x120.png'
        />
        <link
          rel='apple-touch-icon'
          sizes='144x144'
          href='/apple-icon-144x144.png'
        />
        <link
          rel='apple-touch-icon'
          sizes='152x152'
          href='/apple-icon-152x152.png'
        />
        <link
          rel='apple-touch-icon'
          sizes='180x180'
          href='/apple-icon-180x180.png'
        />
        <link
          rel='icon'
          type='image/png'
          sizes='192x192'
          href='/android-icon-192x192.png'
        />
        <link
          rel='icon'
          type='image/png'
          sizes='32x32'
          href='/favicon-32x32.png'
        />
        <link
          rel='icon'
          type='image/png'
          sizes='96x96'
          href='/favicon-96x96.png'
        />
        <link
          rel='icon'
          type='image/png'
          sizes='16x16'
          href='/favicon-16x16.png'
        />
        <link
          rel='manifest'
          href={dark ? '/dark-manifest.json' : '/manifest.json'}
        />
        <meta
          name='msapplication-TileColor'
          content={dark ? '#121212' : '#ffffff'}
        />
        <meta name='msapplication-TileImage' content='/ms-icon-144x144.png' />
        <meta name='apple-mobile-web-app-capable' content='yes' />
        <meta name='apple-mobile-web-app-title' content='Hammock' />
        <meta
          name='apple-mobile-web-app-status-bar-style'
          content='black-translucent'
        />
        <meta name='mobile-web-app-capable' content='yes' />
        <meta name='application-name' content='Hammock' />
        <meta name='theme-color' content={dark ? '#121212' : '#ffffff'} />
        <link rel='preconnect' href='https://cdn.segment.com' />
        <link rel='preconnect' href='https://api.segment.io' />
        <script dangerouslySetInnerHTML={{ __html: segmentSnippet }} />
        <link
          rel='preload'
          href='/api/account'
          crossOrigin='anonymous'
          type='application/json'
          as='fetch'
        />
      </Head>
      {children}
    </>
  );
}
