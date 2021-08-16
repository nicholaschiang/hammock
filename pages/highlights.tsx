import { useEffect, useMemo } from 'react';
import Head from 'next/head';
import InfiniteScroll from 'react-infinite-scroll-component';
import Link from 'next/link';
import cn from 'classnames';

import Avatar from 'components/avatar';
import Empty from 'components/empty';
import Layout from 'components/layout';
import Page from 'components/page';

import { HITS_PER_PAGE } from 'lib/model/query';
import { Highlight, Message } from 'lib/model/message';
import useMessages, { useMessagesMutated } from 'lib/hooks/messages';

interface HighlightProps {
  message?: Message;
  highlight?: Highlight;
}

function HighlightRow({ message, highlight }: HighlightProps): JSX.Element {
  return (
    <Link href={message ? `/messages/${message.id}` : '#'}>
      <a className={cn('row', { disabled: !message })}>
        <div className='from'>
          <Avatar src={message?.from.photo} loading={!message} size={24} />
          <span className={cn('name', { loading: !message })}>
            {message ? `${message.from.name}: ${message.subject}` : ''}
          </span>
        </div>
        <blockquote className={cn({ loading: !message })}>
          {highlight?.text || ''}
        </blockquote>
        <style jsx>{`
          .row {
            display: block;
            text-decoration: none;
            transition: box-shadow 0.2s ease 0s;
            border-radius: 10px;
            margin: 40px 0;
          }

          .row.disabled {
            cursor: wait;
          }

          .row .from,
          .row .header {
            margin: 8px 0;
          }

          .from,
          .subject {
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
          }

          .from {
            display: flex;
            height: 24px;
          }

          .from > .name {
            font-size: 14px;
            font-weight: 400;
            line-height: 24px;
            color: var(--accents-6);
          }

          .from > .name.loading {
            width: 100px;
          }

          .from > :global(.avatar) {
            margin-right: 8px;
          }

          .loading {
            border-radius: 6px;
          }

          blockquote {
            margin: 8px 0;
            padding-left: 18px;
            font-size: 16px;
            font-weight: 400;
            line-height: 24px;
            color: var(--accents-6);
            position: relative;
            display: block;
            quotes: none;
          }

          blockquote:not(.loading)::before {
            background: var(--highlight);
            position: absolute;
            top: 0;
            left: 2px;
            bottom: 0;
            content: '';
            border-radius: 2px;
            width: 4px;
          }

          blockquote.loading {
            height: 72px;
          }
        `}</style>
      </a>
    </Link>
  );
}

/* eslint-disable react/no-array-index-key */
const loader = Array(5)
  .fill(null)
  .map((_, idx) => <HighlightRow key={idx} />);
/* eslint-enable react/no-array-index-key */

export default function HighlightsPage(): JSX.Element {
  // TODO: Show highlights from archived messages too?
  const { data, setSize, mutate } = useMessages();
  const highlights = useMemo(
    () =>
      data
        ?.flat()
        .map((m) =>
          m.highlights
            .filter((h) => !h.deleted)
            .map((h) => ({
              highlight: h,
              message: Message.fromJSON(m),
            }))
        )
        .flat(),
    [data]
  );

  // TODO: Refactor this to reduce code duplication with the `/feed` page.
  const { mutated, setMutated } = useMessagesMutated();
  useEffect(() => {
    // If the message page mutates these messages to e.g. archive a message and
    // thus remove it from the `/feed` page, we have to refresh the messages so
    // that we know whether or not there's more to load in the infinite scroll
    // b/c a mutated `/api/messages` response might not have 5 messages.
    async function refresh(): Promise<void> {
      if (mutated) await mutate();
      setMutated(false);
    }
    void refresh();
  }, [mutated, setMutated, mutate]);

  return (
    <Page name='Highlights' login sync>
      <Head>
        <link
          rel='preload'
          href='/api/messages'
          crossOrigin='anonymous'
          type='application/json'
          as='fetch'
        />
      </Head>
      <Layout>
        <InfiniteScroll
          dataLength={data?.flat().length || 0}
          next={() => setSize((prev) => prev + 1)}
          hasMore={
            !data || data[data.length - 1].length === HITS_PER_PAGE || mutated
          }
          style={{ overflow: undefined }}
          scrollThreshold={0.65}
          loader={loader}
        >
          {highlights &&
            highlights.map(({ highlight, message }) => (
              <HighlightRow
                key={highlight.id}
                highlight={highlight}
                message={message}
              />
            ))}
          {!highlights && loader}
          {highlights && !highlights.length && (
            <Empty>Nothing to see here... yet. Go highlight something!</Empty>
          )}
        </InfiniteScroll>
      </Layout>
    </Page>
  );
}
