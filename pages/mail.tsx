import { useMemo } from 'react';

import Email from 'components/email';

import { Message } from 'lib/model/message';
import useMessages from 'lib/hooks/messages';
import { useUser } from 'lib/context/user';

export default function MailPage(): JSX.Element {
  const { data } = useMessages();
  const { user } = useUser();
  const messages = useMemo(
    () => (data || []).flat().map((m) => Message.fromJSON(m)),
    [data]
  );
  return <Email user={user} messages={messages} />;
}
