import Link from 'next/link';
import cn from 'classnames';
import { useMemo } from 'react';

import Avatar from 'components/avatar';
import Empty from 'components/empty';
import Layout from 'components/layout';
import Page from 'components/page';

import { Highlight, Message } from 'lib/model/message';
import useMessages from 'lib/hooks/messages';

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
            padding-left: 16px;
            font-size: 16px;
            font-weight: 400;
            line-height: 24px;
            color: var(--accents-6);
            position: relative;
            display: block;
            quotes: none;
          }

          blockquote::before {
            background: var(--highlight);
            position: absolute;
            top: 0;
            left: 0;
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

/* eslint-disable-next-line react/no-array-index-key */
const loadingRows = Array(5)
  .fill(null)
  .map((_, idx) => <HighlightRow key={idx} />);

export default function HighlightsPage(): JSX.Element {
  const { data } = useMessages();
  // TODO: Perhaps put this `useMemo` statement into the `useMessages` hook.
  const highlights = useMemo(
    () =>
      data
        ?.flat()
        .map((m) =>
          m.highlights.map((h) => ({
            highlight: h,
            message: Message.fromJSON(m),
          }))
        )
        .flat(),
    [data]
  );

  return (
    <Page name='Highlights' login sync>
      <Layout>
        {highlights &&
          highlights.map(({ highlight, message }) => (
            <HighlightRow
              key={highlight.id}
              highlight={highlight}
              message={message}
            />
          ))}
        {!highlights && loadingRows}
        {highlights && !highlights.length && (
          <Empty>Nothing to see here... yet. Go highlight something!</Empty>
        )}
      </Layout>
    </Page>
  );
}
