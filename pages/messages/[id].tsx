import Router, { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useSWR, { mutate } from 'swr';
import cn from 'classnames';

import { MessageRes } from 'pages/api/messages/[id]';

import Avatar from 'components/avatar';
import Controls from 'components/controls';
import Page from 'components/page';

import { Message } from 'lib/model/message';
import { fetcher } from 'lib/fetch';
import usePage from 'lib/hooks/page';

/**
 * @param The element to get the vertical scroll percentage for.
 * @return A number between 0 to 1 relative to scroll position.
 * @see {@link https://stackoverflow.com/a/28994709/10023158}
 */
function getVerticalScrollPercentage(elm: HTMLElement): number {
  const p = elm.parentNode as HTMLElement;
  return (elm.scrollTop || p.scrollTop) / (p.scrollHeight - p.clientHeight);
}

export default function MessagePage(): JSX.Element {
  usePage({ name: 'Message', login: true });

  const { query } = useRouter();
  const { data } = useSWR<MessageRes>(
    typeof query.id === 'string' ? `/api/messages/${query.id}` : null
  );
  const message = useMemo(
    () => (data ? Message.fromJSON(data) : new Message()),
    [data]
  );

  const [scroll, setScroll] = useState<number>(message.scroll);
  useEffect(() => {
    function handleScroll(): void {
      const scrollPercent = getVerticalScrollPercentage(document.body);
      setScroll(scrollPercent);
    }
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  useEffect(() => {
    // TODO: Save the message scroll position in our database every second.
    // Currently, this saves the scroll position after a second of no scrolling.
    // Instead, I want to schedule an update every one second where we:
    // - If the scroll position hasn't changed since the last save, skip.
    // - Otherwise, save the latest scroll position in our database.
    async function saveScrollPosition(): Promise<void> {
      if (!message.id) return;
      const url = `/api/messages/${message.id}`;
      const data = { ...message.toJSON(), scroll };
      if (scroll === 1) data.archived = true;
      // TODO: Mutate the data used in `/feed` to match.
      // See: https://github.com/vercel/swr/issues/1156
      await mutate(url, fetcher(url, 'put', data));
      if (data.archived) Router.back();
    }
    const timeoutId = setTimeout(() => {
      void saveScrollPosition();
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [message, scroll]);

  // TODO: Save the scroll position percent of the last visible part of
  // newsletter in viewport (scroll percent should be relative to newsletter).
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const onLoad = useCallback(() => {
    const i = iframeRef.current;
    const height = i?.contentWindow?.document.body.scrollHeight;
    if (height) i?.setAttribute('height', `${height + 20}px`);
    window.scrollTo(0, message.scroll * document.body.scrollHeight);
  }, [message.scroll]);

  return (
    <Page title='Message - Hammock'>
      <Controls message={message} />
      <div className='page'>
        <div className='header'>
          <header>
            <h1 className={cn({ loading: !data })}>{message.subject}</h1>
            <a
              target='_blank'
              className='author'
              rel='noopener noreferrer'
              href={`mailto:${message.from.email}`}
            >
              <Avatar src={message.from.photo} loading={!data} size={24} />
              <span className={cn('from', { loading: !data })}>
                {message.from.name}
              </span>
              {data && <span className='on'>on</span>}
              {data && message.date.toDateString() !== 'Invalid Date' && (
                <span className='date'>{message.date.toDateString()}</span>
              )}
            </a>
          </header>
        </div>
        <iframe
          width='100%'
          height='0px'
          ref={iframeRef}
          onLoad={onLoad}
          srcDoc={message.html}
          title={message.subject}
          sandbox='allow-same-origin allow-popups'
        />
      </div>
      <style jsx>{`
        .page {
          max-width: 1000px;
          padding: 0 48px;
          margin: 96px auto;
        }

        iframe {
          border: 2px solid var(--accents-2);
          border-radius: 10px;
        }

        div.header {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        header {
          max-width: 500px;
          text-align: center;
          margin: 0 0 48px;
        }

        h1 {
          font-size: 32px;
          font-weight: 600;
          line-height: 40px;
          color: var(--accents-6);
        }

        h1.loading {
          height: 80px;
          width: 400px;
          border-radius: 6px;
        }

        .author {
          display: inline-flex;
          align-items: center;
          text-decoration: none;
          color: var(--accents-5);
        }

        .author span {
          font-size: 16px;
          font-weight: 400;
          line-height: 18px;
          height: 18px;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .author .from {
          margin-left: 8px;
          transition: color 0.1s ease 0s;
        }

        .author span.loading {
          width: 240px;
          border-radius: 6px;
        }

        .author:hover .from {
          color: var(--on-background);
        }

        header .author .on {
          margin-left: 4px;
          margin-right: 4px;
        }
      `}</style>
    </Page>
  );
}
