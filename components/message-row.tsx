import Link from 'next/link';
import cn from 'classnames';

import Avatar from 'components/avatar';

import { Message } from 'lib/model/message';

export interface MessageRowProps {
  message?: Message;
  loading?: boolean;
  date?: boolean;
}

export default function MessageRow({
  message,
  loading,
  date,
}: MessageRowProps): JSX.Element {
  return (
    <Link href={message ? `/messages/${message.id}` : ''}>
      <a className={cn('row', { disabled: loading })}>
        <div className='from'>
          <Avatar src={message?.from.photo} loading={loading} size={24} />
          <span className={cn('name', { loading })}>{date ? message?.date.toLocaleString('en', { month: 'short', day: 'numeric' }) : message?.from.name}</span>
        </div>
        <div className='header'>
          <h3 className={cn('subject', { loading })}>{message?.subject}</h3>
          <div className={cn('time', { loading })}>
            {message ? `${message.time} min` : ''}
          </div>
        </div>
        <p className={cn('snippet', { loading })}>{message?.snippet}</p>
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

          .header {
            display: flex;
            height: 24px;
          }

          .header > .subject {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
            line-height: 24px;
            height: 24px;
            color: var(--accents-6);
          }

          .header > .subject.loading {
            width: 300px;
          }

          .header > .time {
            flex: none;
            margin-left: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 24px;
            padding: 12px;
            font-size: 12px;
            font-weight: 600;
            color: var(--accents-6);
            background: var(--accents-2);
            border-radius: 12px;
          }

          .header > .time.loading {
            width: 50px;
          }

          .header > .subject.loading,
          .snippet.loading,
          .name.loading {
            border-radius: 6px;
          }

          .snippet {
            margin: 8px 0;
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
