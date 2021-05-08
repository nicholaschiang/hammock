import Page from 'components/page';
import Subscriptions from 'components/subscriptions';

import usePage from 'lib/hooks/page';

export default function SubscriptionsPage(): JSX.Element {
  usePage({ name: 'Subscriptions', login: true });

  return (
    <Page title='Subscriptions - Return of the Newsletter'>
      <Subscriptions />
    </Page>
  );
}
