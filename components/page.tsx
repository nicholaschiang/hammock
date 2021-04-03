import { GoogleFonts } from 'next-google-fonts';
import { ReactNode } from 'react';
import Head from 'next/head';

export interface PageProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export default function Page({
  title,
  description,
  children,
}: PageProps): JSX.Element {
  return (
    <>
      <Head>
        <title>{title}</title>
        {description && <meta name='description' content={description} />}
        <meta charSet='UTF-8' />
        <meta name='viewport' content='width=device-width,initial-scale=1.0' />
        <link rel='preload' href='/api/account' as='fetch' />
        <link
          href='https://uploads-ssl.webflow.com/5fd7d136cd029b7af8bdca15/5ff7c15e2096043b6eee8132_newsletter-favicon.png'
          rel='shortcut icon'
          type='image/x-icon'
        />
      </Head>
      <GoogleFonts href='https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap' />
      {children}
    </>
  );
}
