import Head from 'next/head';
import InfiniteScroll from 'react-infinite-scroll-component';
import Link from 'next/link';
import cn from 'classnames';
import { useCallback } from 'react';
import { useSWRInfinite } from 'swr';

import { HighlightWithMessage } from 'pages/api/highlights';

import Avatar from 'components/avatar';
import Empty from 'components/empty';
import Layout from 'components/layout';
import Page from 'components/page';

import { HITS_PER_PAGE } from 'lib/model/query';

interface HighlightProps {
  highlight?: HighlightWithMessage;
}

function HighlightRow({ highlight }: HighlightProps): JSX.Element {
  return (
    <Link href={highlight ? `/messages/${highlight.message.id}` : '#'}>
      <a className={cn('row', { disabled: !highlight })}>
        <div className='from'>
          <Avatar
            src={highlight?.message.photo}
            loading={!highlight}
            size={24}
          />
          <span className={cn('name', { loading: !highlight })}>
            {highlight
              ? `${highlight.message.name}: ${highlight.message.subject}`
              : ''}
          </span>
        </div>
        <blockquote className={cn({ loading: !highlight })}>
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
  const getKey = useCallback(
    (pageIdx: number, prev: HighlightWithMessage[] | null) => {
      if (prev && !prev.length) return null;
      if (!prev || pageIdx === 0) return '/api/highlights';
      return `/api/highlights?page=${pageIdx}`;
    },
    []
  );
  const { data, setSize } = useSWRInfinite<HighlightWithMessage[]>(getKey);

  return (
    <Page name='Highlights' login sync>
      <Head>
        <link
          rel='preload'
          href='/api/highlights'
          crossOrigin='anonymous'
          type='application/json'
          as='fetch'
        />
      </Head>
      <Layout>
        <InfiniteScroll
          dataLength={data?.flat().length || 0}
          next={() => setSize((prev) => prev + 1)}
          hasMore={!data || data[data.length - 1].length === HITS_PER_PAGE}
          style={{ overflow: undefined }}
          scrollThreshold={0.65}
          loader={loader}
        >
          {data &&
            data
              .flat()
              .map((highlight) => (
                <HighlightRow key={highlight.id} highlight={highlight} />
              ))}
          {!data && loader}
          {data && !data.length && (
            <Empty>Nothing to see here... yet. Go highlight something!</Empty>
          )}
        </InfiniteScroll>
      </Layout>
    </Page>
  );
}
