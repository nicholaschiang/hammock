import { useMemo } from 'react';
import { useRouter } from 'next/router';
import useSWR from 'swr';

import Content from 'components/content';
import Article from 'components/article';
import Controls from 'components/controls';
import Page from 'components/page';

import { MessageRes } from 'pages/api/messages/[id]';

import { Message } from 'lib/model/message';
import { parseFrom } from 'lib/utils';
import usePage from 'lib/hooks/page';

export default function MessagePage(): JSX.Element {
  usePage({ name: 'Message', login: true });

  const { query } = useRouter();
  const { data } = useSWR<MessageRes>(
    query.id ? `/api/messages/${query.id}` : null
  );

  const message = useMemo(
    () => (data ? Message.fromJSON(data) : new Message()),
    [data]
  );

  const from = message.getHeader('from');
  const subject = message.getHeader('subject');
  const createdAt = new Date(parseInt(message.internalDate));

  return (
    <Page title='Message - Return of the Newsletter'>
      <Controls />
      <Content>
        <div className='full-w text-xl text-center pb-2 flex items-center justify-center'>
          <img
            className='rounded-full h-5 w-5 inline-block mr-2'
            src={message.icon}
          />
          {from && parseFrom(from).name}
        </div>
        <div className='text-lg'>{subject}</div>
        <div className='text-sm text-gray-400 pb-2'>
          {createdAt.toDateString()}
        </div>
        <Article message={message} />
      </Content>
    </Page>
  );
}
