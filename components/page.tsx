import Head from 'next/head';
import { ReactNode } from 'react';

import segmentSnippet from 'lib/segment-snippet';

export interface PageProps {
  title: string;
  children: ReactNode;
}

export default function Page({ title, children }: PageProps): JSX.Element {
  return (
    <>
      <Head>
        <title>{title}</title>
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
