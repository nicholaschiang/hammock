import Link from 'next/link';
import cn from 'classnames';

import Avatar from 'components/avatar';

import { Message } from 'lib/model/message';

export interface MessageRowProps {
  message?: Message;
  loading?: boolean;
}

export default function MessageRow({
  message,
  loading,
}: MessageRowProps): JSX.Element {
  return (
    <Link href={message ? `/messages/${message.id}` : ''}>
      <a className={cn('row', { disabled: loading })}>
        <div className='header'>
          <Avatar src={message?.from.photo} loading={loading} size={24} />
          <span className={cn('name', { loading })}>{message?.from.name}</span>
        </div>
        <div className={cn('subject', { loading })}>{message?.subject}</div>
        <div className={cn('snippet', { loading })}>{message?.snippet}</div>
        <style jsx>{`
          .row {
            display: block;
            text-decoration: none;
            transition: box-shadow 0.2s ease 0s;
            padding: 12px 24px;
            border-radius: 10px;
            margin: 0;
          }

          .row.disabled {
            cursor: wait;
          }

          .row:hover {
            box-shadow: var(--shadow-medium);
          }

          .row > div {
            margin: 8px 0;
          }

          .header,
          .subject {
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
          }

          .header {
            display: flex;
            height: 24px;
          }

          .header > span.name {
            font-size: 14px;
            font-weight: 400;
            line-height: 24px;
            color: var(--accents-5);
          }

          .header > span.name.loading {
            width: 100px;
          }

          .header > :global(div) {
            margin-right: 8px;
          }

          .subject {
            font-size: 18px;
            font-weight: 700;
            line-height: 24px;
            height: 24px;
            color: var(--accents-6);
          }

          .subject.loading,
          .snippet.loading,
          .name.loading {
            border-radius: 6px;
          }

          .snippet {
            font-size: 16px;
            font-weight: 400;
            line-height: 24px;
            color: var(--accents-6);
          }

          .snippet.loading {
            height: 72px;
          }
        `}</style>
      </a>
    </Link>
  );
}
