import Head from 'next/head';
import { AppProps } from 'next/app';

import 'styles/globals.css';

export default function App({ Component, pageProps }: AppProps): JSX.Element {
  return (
    <>
      <Head>
        <script
          src='https://apis.google.com/js/platform.js?onload=init'
          async
          defer
        ></script>
        <link
          href='https://uploads-ssl.webflow.com/5fd7d136cd029b7af8bdca15/5ff7c15e2096043b6eee8132_newsletter-favicon.png'
          rel='shortcut icon'
          type='image/x-icon'
        />
        <title>Newsletter Reader</title>
      </Head>
      <Component {...pageProps} />
    </>
  );
}
