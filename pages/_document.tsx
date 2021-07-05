import NextDocument, { Head, Html, Main, NextScript } from 'next/document';

// TODO: Right now the default theme is "light" but eventually we should set the
// default theme to "system" once "dark" is no longer experimental.
const themeSnippet = `document.documentElement.classList.add(localStorage.getItem('theme') || 'light');`;

// Prevent FOUC on Firefox due to an age-old script processing bug.
// @see {@link https://nextjs.org/docs/advanced-features/custom-document}
// @see {@link https://github.com/vercel/next.js/issues/22465}
export default class Document extends NextDocument {
  render() {
    return (
      <Html>
        <Head>
          <link rel='preconnect' href='https://fonts.gstatic.com' />
          <link
            href='https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'
            rel='stylesheet'
          />
        </Head>
        <body>
          <script dangerouslySetInnerHTML={{ __html: themeSnippet }} />
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
