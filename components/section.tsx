import cn from 'classnames';

import MessageRow from 'components/message-row';

import { Message, MessageJSON } from 'lib/model/message';

export interface SectionProps {
  header: string;
  messages: MessageJSON[];
}

export default function Section({ header, messages }: Partial<SectionProps>): JSX.Element {
  return (
    <div className='section'>
      <div className='header'>
        <h2 className={cn('nowrap date', { loading: !header })}>{header}</h2>
        <div className='line' />
      </div>
      <div className='messages'>
        {(messages || Array(3).fill(null)).map((m, idx) => (
          <MessageRow 
            loading={!m} 
            message={m ? Message.fromJSON(m) : undefined} 
            key={m ? m.id : idx} 
          />
        ))}
      </div>
      <style jsx>{`
        .section > .header {
          background: var(--background);
          position: sticky;
          margin: 0 -24px;
          padding: 0 24px;
          z-index: 1;
          top: 96px;
        }

        .section > .header > h2.date {
          color: var(--accents-5);
          font-size: 18px;
          font-weight: 700;
          line-height: 24px;
          margin: 24px;
          height: 24px;
        }

        .section > .header > h2.date.loading {
          border-radius: 6px;
          max-width: 50px;
        }

        .section > .messages {
          padding-bottom: 48px;
        }

        .header > .line {
          border-bottom: 2px solid var(--accents-2);
          margin: 24px;
        }
      `}</style>
    </div>
  );
}
