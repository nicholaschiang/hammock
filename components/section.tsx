import cn from 'classnames';

import MessageRow from 'components/message-row';

import { Message } from 'lib/model/message';
import breakpoints from 'lib/breakpoints';

export interface SectionProps {
  messages: Message[];
  header: string;
  date?: boolean;
}

export default function Section({
  messages,
  header,
  date,
}: Partial<SectionProps>): JSX.Element {
  return (
    <div className='section'>
      <div className='header'>
        <h2 className={cn('nowrap date', { loading: !header })}>{header}</h2>
        <div className='line' />
      </div>
      <div className='messages'>
        {(messages || Array(3).fill(null)).map((m, idx) => (
          <MessageRow
            date={date}
            loading={!m}
            message={m ? (m as Message) : undefined}
            key={m ? (m as Message).id : idx}
          />
        ))}
      </div>
      <style jsx>{`
        .section > .header {
          background: var(--background);
          padding-top: 24px;
          position: sticky;
          height: 74px;
          z-index: 1;
          top: 72px;
        }

        @media (max-width: ${breakpoints.mobile}) {
          .section > .header {
            z-index: 2;
            top: 0;
          }
        }

        .section > .header > h2.date {
          color: var(--accents-6);
          font-size: 18px;
          font-weight: 400;
          line-height: 24px;
          margin: 0 0 24px;
          height: 24px;
        }

        .section > .header > h2.date.loading {
          border-radius: 6px;
          max-width: 50px;
        }

        .section > .messages {
          padding-bottom: 24px;
        }

        .section:last-of-type > .messages {
          padding-bottom: 0;
        }

        .header > .line {
          border-bottom: 2px solid var(--accents-2);
          margin: 24px 0;
        }
      `}</style>
    </div>
  );
}
