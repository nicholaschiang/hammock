import NProgress from 'nprogress';
import Router from 'next/router';

import nprogress from 'styles/nprogress';

let timeout: ReturnType<typeof setTimeout>;

Router.events.on('routeChangeStart', (url, { shallow }) => {
  if (shallow) return;
  timeout = setTimeout(() => NProgress.start(), 150);
});
Router.events.on('routeChangeComplete', (url, { shallow }) => {
  if (shallow) return;
  clearTimeout(timeout);
  NProgress.done();
});
Router.events.on('routeChangeError', (err, url, { shallow }) => {
  if (shallow) return;
  clearTimeout(timeout);
  NProgress.done();
});

export default function Progress(): JSX.Element {
  return (
    <style jsx global>
      {nprogress}
    </style>
  );
}
