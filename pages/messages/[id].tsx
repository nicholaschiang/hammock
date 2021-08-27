import Router, { useRouter } from 'next/router';
import { useCallback, useEffect, useRef, useState } from 'react';
import useSWR, { mutate } from 'swr';
import Link from 'next/link';
import cn from 'classnames';

import { MessagesRes } from 'pages/api/messages';

import Article from 'components/article';
import Controls from 'components/controls';
import Page from 'components/page';

import { Message } from 'lib/model/message';
import breakpoints from 'lib/breakpoints';
import { fetcher } from 'lib/fetch';
import useMessages from 'lib/hooks/messages';

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
  const { mutate: mutateMessages } = useMessages();
  const { query } = useRouter();
  const { data: message } = useSWR<Message>(
    typeof query.id === 'string' ? `/api/messages/${query.id}` : null
  );

  const [scroll, setScroll] = useState<number>(message?.scroll || 0);
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
    if (!message?.id) return;
    if (message.archived) {
      window.analytics?.track('Message Unarchived');
    } else {
      window.analytics?.track('Message Archived');
    }
    setArchiving(true);
    const url = `/api/messages/${message.id}`;
    const updated = { ...message, scroll, archived: !message.archived };
    // To make this feel as reactive and fast as possible, we:
    // 1. Mutate local message (both the message page message and feed page message).
    // 2. Trigger the `PUT` request to update server-side message.
    // 3. Navigate back.
    // 4. Once the `PUT` request resolves, mutate the message page message.
    await mutate(url, updated, false);
    // TODO: Find an elegant way to mutate all the different possible feed
    // queries (e.g. for the archive page, quick read page, writers pages).
    await mutateMessages(
      (res?: MessagesRes[]) =>
        res?.map((messages) => {
          const idx = messages.findIndex((m) => m.id === updated.id);
          if (idx < 0) return messages;
          if (updated.archived)
            return [...messages.slice(0, idx), ...messages.slice(idx + 1)];
          return [
            ...messages.slice(0, idx),
            updated,
            ...messages.slice(idx + 1),
          ];
        }),
      false
    );
    void mutate(url, fetcher(url, 'put', updated), false);
    if (updated.archived) Router.back();
  }, [mutateMessages, scroll, message]);

  useEffect(() => {
    // Don't try to update the scroll position if we're archiving the message.
    // @see {@link https://github.com/readhammock/hammock/issues/37}
    if (archiving) return () => {};
    // TODO: Save the message scroll position in our messagebase every second.
    // Currently, this saves the scroll position after a second of no scrolling.
    // Instead, I want to schedule an update every one second where we:
    // - If the scroll position hasn't changed since the last save, skip.
    // - Otherwise, save the latest scroll position in our messagebase.
    async function saveScrollPosition(): Promise<void> {
      if (!message?.id) return;
      const url = `/api/messages/${message.id}`;
      const updated = { ...message, scroll };
      // TODO: Mutate the message used in `/feed` to match.
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
    if (hasScrolled.current || !message?.scroll) return;
    window.scrollTo(0, message.scroll * document.body.scrollHeight);
    hasScrolled.current = true;
  }, [message?.scroll]);

  return (
    <Page title={message?.subject} name='Message' login>
      <Controls
        disabled={!message || archiving}
        archived={message?.archived || false}
        archive={archive}
      />
      <div className='page'>
        <header>
          <h1 className={cn({ loading: !message })}>
            {trim(message?.subject || '')}
          </h1>
          <h2 className={cn({ loading: !message })}>
            {trim(message?.snippet.split('.')[0] || '')}
          </h2>
          <Link href={message ? `/writers/${message.email}` : '#'}>
            <a className={cn('author', { disabled: !message })}>
              <h3 className={cn({ loading: !message })}>
                {message && message.name}
                {message && <span>·</span>}
                {message &&
                  new Date(message.date).toLocaleString('en', {
                    month: 'short',
                    day: 'numeric',
                  })}
              </h3>
            </a>
          </Link>
        </header>
        <Article message={message} />
      </div>
      <style jsx>{`
        .page {
          max-width: 648px;
          padding: 0 24px;
          margin: 96px auto;
        }

        @media (max-width: ${breakpoints.mobile}) {
          .page {
            margin: 24px auto 96px;
          }
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
      `}</style>
    </Page>
  );
}
