import cn from 'classnames';
import { useMemo } from 'react';
import { useRouter } from 'next/router';
import useSWR from 'swr';

import { MessageRes } from 'pages/api/messages/[id]';

import Article from 'components/article';
import Avatar from 'components/avatar';
import Controls from 'components/controls';
import Page from 'components/page';

import { Message } from 'lib/model/message';
import { parseFrom } from 'lib/utils';
import usePage from 'lib/hooks/page';

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

  const from = message.getHeader('from');
  const subject = message.getHeader('subject');
  const createdAt = new Date(Number(message.internalDate));

  return (
    <Page title='Message - Return of the Newsletter'>
      <Controls />
      <div className='page'>
        <div className='header'>
          <header>
            <h1 className={cn({ loading: !data })}>{subject}</h1>
            <a
              target='_blank'
              className='author'
              rel='noopener noreferrer'
              href={`mailto:${from}`}
            >
              <Avatar src={message.icon} loading={!data} size={24} />
              <span className={cn('from', { loading: !data })}>
                {data && from && parseFrom(from).name}
              </span>
              {data && <span className='on'>on</span>}
              {data && createdAt.toDateString() !== 'Invalid Date' && (
                <span className='date'>{createdAt.toDateString()}</span>
              )}
            </a>
          </header>
        </div>
        <Article message={message} />
      </div>
      <style jsx>{`
        .page {
          max-width: 1000px;
          padding: 0 48px;
          margin: 96px auto;
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
