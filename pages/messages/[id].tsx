import Router, { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useSWR, { mutate } from 'swr';
import Link from 'next/link';
import cn from 'classnames';

import { MessageRes } from 'pages/api/messages/[id]';

import Controls from 'components/controls';
import Page from 'components/page';

import { Message } from 'lib/model/message';
import { fetcher } from 'lib/fetch';

/**
 * Extends the built-in browser `String#trim` method to account for zero-width
 * spaces (i.e. the `\u200B` char code).
 * @see {@link https://github.com/jprichardson/string.js/issues/182}
 * @see {@link https://en.wikipedia.org/wiki/Zero-width_space}
 */
function trim(str: string): string {
  return str.replace(/^[\s\uFEFF\xA0\u200B]+|[\s\uFEFF\xA0\u200B]+$/g, '');
}

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

  const [archiving, setArchiving] = useState<boolean>(false);
  const archive = useCallback(async () => {
    if (!message.id) return;
    if (message.archived) {
      window.analytics?.track('Message Unarchived', message.toSegment());
    } else {
      window.analytics?.track('Message Archived', message.toSegment());
    }
    setArchiving(true);
    const url = `/api/messages/${message.id}`;
    const updated = {
      ...message.toJSON(),
      scroll,
      archived: !message.archived,
    };
    await mutate(url, fetcher(url, 'put', updated));
    // TODO: Mutate the data used in `/feed` to match.
    // @see {@link https://github.com/vercel/swr/issues/1156}
    if (!message.archived) Router.back();
    setArchiving(false);
  }, [scroll, message]);

  useEffect(() => {
    // Don't try to update the scroll position if we're archiving the message.
    // @see {@link https://github.com/readhammock/hammock/issues/37}
    if (archiving) return () => {};
    // TODO: Save the message scroll position in our database every second.
    // Currently, this saves the scroll position after a second of no scrolling.
    // Instead, I want to schedule an update every one second where we:
    // - If the scroll position hasn't changed since the last save, skip.
    // - Otherwise, save the latest scroll position in our database.
    async function saveScrollPosition(): Promise<void> {
      if (!message.id) return;
      const url = `/api/messages/${message.id}`;
      const updated = { ...message.toJSON(), scroll };
      // TODO: Mutate the data used in `/feed` to match.
      // See: https://github.com/vercel/swr/issues/1156
      await mutate(url, fetcher(url, 'put', updated));
    }
    const timeoutId = setTimeout(() => {
      void saveScrollPosition();
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [archiving, message, scroll]);

  // TODO: Save the scroll position percent of the last visible part of
  // newsletter in viewport (scroll percent should be relative to newsletter).
  const hasScrolled = useRef<boolean>(false);
  useEffect(() => {
    if (hasScrolled.current) return;
    window.scrollTo(0, message.scroll * document.body.scrollHeight);
    hasScrolled.current = true;
  }, [message.scroll]);

  return (
    <Page name='Message' login>
      <Controls
        disabled={!data || archiving}
        archived={message.archived}
        archive={archive}
      />
      <div className='page'>
        <header>
          <h1 className={cn({ loading: !data })}>{trim(message.subject)}</h1>
          <h2 className={cn({ loading: !data })}>{trim(message.snippet.split('.')[0])}</h2>
          <Link href={`/writers/${message.from.email}`}>
            <a className={cn('author', { disabled: !data })}>
              <h3 className={cn({ loading: !data })}>
                {data && message.from.name}
                {data && <span>·</span>}
                {data && message.date.toLocaleString('en', { month: 'short', day: 'numeric' })}</h3>
            </a>
          </Link>
        </header>
        {data && <article dangerouslySetInnerHTML={{ __html: message.html }} />}
        {!data && (
          <article>
            <p className='loading' />
            <p className='loading' />
            <p className='loading' />
          </article>
        )}
      </div>
      <style jsx>{`
        .page {
          max-width: 720px;
          padding: 0 48px;
          margin: 96px auto;
        }

        header {
          margin: 0 0 2rem;
        }

        header h1 {
          font-size: 2rem;
          font-weight: 700;
          line-height: 1.35;
          margin: 1rem 0;
        }

        header h1.loading {
          height: calc(1.35 * 2rem * 2);
          border-radius: 6px;
        }

        header h2 {
          font-size: 1.5rem;
          font-weight: 500;
          line-height: 1.35;
          margin: 1rem 0;
          color: var(--accents-5);
        }

        header h2.loading {
          height: calc(1.35 * 1.5rem * 2);
          border-radius: 6px;
        }

        header h3 {
          font-size: 1rem;
          font-weight: 400;
          margin: 1rem 0;
        }

        header h3.loading {
          height: 1.65rem;
          border-radius: 6px;
          max-width: 250px;
        }

        header h3 span {
          margin: 0 0.5rem;
          font-weight: 700;
        }

        header .author {
          text-decoration: none;
          cursor: pointer;
          color: unset;
        }
       
        header .author.disabled {
          cursor: wait;
        }

        p.loading {
          border-radius: 6px;
        }

        p.loading:nth-child(1) {
          height: 45px;
        }

        p.loading:nth-child(2) {
          height: 90px;
        }

        p.loading:nth-child(3) {
          height: 500px;
        }

        article :global(img) {
          max-width: 100%;
          height: auto;
          border: 1px solid var(--accents-2);
          background-color: var(--accents-1);
          display: block;
          margin: 1rem 0;
        }

        article :global(p) {
          font-size: 1rem;
          font-weight: 400;
          margin: 1rem 0;
        }

        article :global(a) {
          color: var(--accents-5);
        }

        article :global(strong) {
          font-weight: 600;
        }
        
        article :global(b) {
          font-weight: 600;
        }
        
        article :global(h1),
        article :global(h2),
        article :global(h3),
        article :global(h4),
        article :global(h5),
        article :global(h6) {
          font-size: 1rem;
          font-weight: 600;
          margin: 1rem 0;
        }

        article :global(h1) {
          font-size: 1.3rem;
        }

        article :global(h2) {
          font-size: 1.2rem;
        }

        article :global(h3) {
          font-size: 1.1rem;
        }
      `}</style>
    </Page>
  );
}
