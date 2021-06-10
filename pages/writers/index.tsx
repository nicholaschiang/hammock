import Link from 'next/link';
import cn from 'classnames';
import { useMemo } from 'react';

import Avatar from 'components/avatar';
import Empty from 'components/empty';
import Layout from 'components/layout';
import Page from 'components/page';

import { Contact } from 'lib/model/subscription';
import { useUser } from 'lib/context/user';

interface WriterRowProps {
  writer?: Contact;
}

function WriterRow({ writer }: WriterRowProps): JSX.Element {
  return (
    <Link href={`/writers/${writer?.email}`}>
      <a>
        <li className={cn({ disabled: !writer })}>
          <Avatar
            src={writer?.photo}
            loading={!writer}
            size={36}
          />
          {!writer && <span className='name loading' />}
          {writer && (
            <span className='name nowrap'>{writer?.name}</span>
          )}
        </li>
        <style jsx>{`
          a {
            text-decoration: none;
            color: unset;
          }

          li {
            display: flex;
            align-items: center;
            margin: 16px 0;
            cursor: pointer;
          }

          li.disabled {
            cursor: wait;
          }

          li:first-child {
            margin-top: 0;
          }

          li > :global(.avatar) {
            flex: none;
          }

          .name {
            flex: 1 1 auto;
            width: 0;
            font-size: 16px;
            font-weight: 400;
            line-height: 18px;
            height: 18px;
            margin: 0 24px;
          }

          .name.loading {
            border-radius: 6px;
          }
        `}</style>
      </a>
    </Link>
  );
}

export default function WritersPage(): JSX.Element {
  const { user, loggedIn } = useUser();
  
  const loadingList = useMemo(
    () =>
      Array(5)
        .fill(null)
        .map((_, idx) => <WriterRow key={idx} />),
    []
  );
  
  return (
    <Page name='Writers' login sync>
      <Layout>
        {!loggedIn && <ul>{loadingList}</ul>}
        {loggedIn && !!user.subscriptions.length && (
          <ul>
            {user.subscriptions.map(({ from: writer }) => (
              <WriterRow key={writer.email} writer={writer} />
            ))}
          </ul>
        )}
        {loggedIn && !user.subscriptions.length && (
          <Empty>No writers to show</Empty>
        )}
        <style jsx>{`
          ul {
            list-style: none;
            margin: 24px;
            padding: 0;
          }
        `}</style>
      </Layout>
    </Page>
  );
}
