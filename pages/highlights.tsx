import Head from 'next/head';
import InfiniteScroll from 'react-infinite-scroll-component';
import Link from 'next/link';
import cn from 'classnames';

import Avatar from 'components/avatar';
import Empty from 'components/empty';
import Layout from 'components/layout';
import Page from 'components/page';

import { HighlightWithMessage } from 'lib/model/highlight';
import useFetch from 'lib/hooks/fetch';

interface HighlightProps {
  highlight?: HighlightWithMessage;
}

function HighlightRow({ highlight }: HighlightProps): JSX.Element {
  return (
    <Link href={highlight ? `/messages/${highlight.message.id}` : '#'}>
      <a
        className={cn('row', { disabled: !highlight })}
        data-cy='highlight-row'
        data-loading={!highlight}
      >
        <div className='from'>
          <Avatar
            src={highlight?.message.photo}
            loading={!highlight}
            size={24}
          />
          <span className={cn('name', { loading: !highlight })} data-cy='name'>
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
  // Fetch wraps `useSWRInfinite` and keeps track of which resources are being
  // fetched (`highlight`). It can then be reused to mutate a single resource
  // and unpause revalidations once that mutation has been updated server-side.
  const { data, setSize, hasMore } = useFetch<HighlightWithMessage>(
    'highlight',
    '/api/highlights'
  );

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
          hasMore={hasMore}
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
          {data && !data.flat().length && (
            <Empty>Nothing to see here... yet. Go highlight something!</Empty>
          )}
        </InfiniteScroll>
      </Layout>
    </Page>
  );
}
