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
          content='A place where you can enjoy reading and learning from newsletters. So you spend less time in your inbox.'
          name='description'
        />
        <meta charSet='UTF-8' />
        <meta name='viewport' content='width=device-width,initial-scale=1.0' />
        <meta content='Hammock App - Newsletter Reader' property='og:title' />
        <meta
          content='A place where you can enjoy reading and learning from newsletters. So you spend less time in your inbox.'
          property='og:description'
        />
        <meta content='/images/hammock-app.png' property='og:image' />
        <meta
          content='Hammock App - Newsletter Reader'
          property='twitter:title'
        />
        <meta
          content='A place where you can enjoy reading and learning from newsletters. So you spend less time in your inbox.'
          property='twitter:description'
        />
        <meta content='/images/hammock-app.png' property='twitter:image' />
        <meta property='og:type' content='website' />
        <meta content='summary_large_image' name='twitter:card' />
        <link
          href='/images/favicon.png'
          rel='shortcut icon'
          type='image/x-icon'
        />
        <link href='/images/webclip.png' rel='apple-touch-icon' />
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
