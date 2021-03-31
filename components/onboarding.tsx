import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import _ from 'lodash';

import Content from 'components/content';
import Divider from 'components/divider';

import { createFilter, createLabel, fetchNewsletters } from 'lib/gmail';
import { firebase, TUser } from 'lib/auth';
import { Newsletter } from 'lib/newsletter';

export default function Onboarding({ user }: { user: TUser }) {
  const router = useRouter();
  const [newsletters, setNewsletters] = useState<Newsletter[] | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const f = async () => {
      let nl = await fetchNewsletters(user.oauth_access_token);
      nl = _.sortBy(nl, (n) => !n.selected);
      setNewsletters(nl);
    };
    f();
  }, []);

  const onSave = async () => {
    if (isCreating) return;
    setIsCreating(true);

    const selectedNewsletters = newsletters?.filter((n) => n.selected) || [];
    if (selectedNewsletters.length === 0) {
      console.log('No selected newsletters!');
      return;
    }
    console.log('selectedNewsletters', selectedNewsletters);
    let labelId = user.label_id;
    if (!labelId) {
      labelId = await createLabel(
        user.oauth_access_token,
        'Return of the Newsletter'
      );
    }
    const filters: { id: string; from: string; name: string }[] =
      user.filters ?? [];
    for (const nl of selectedNewsletters) {
      if (filters.find((f) => f.from === nl.from) != null) {
        continue;
      }
      const filterId = await createFilter(
        user.oauth_access_token,
        labelId,
        nl.from
      );
      if (filterId)
        filters.push({ id: filterId, from: nl.from, name: nl.name });
    }
    console.log('new filters', filters);
    await firebase.firestore().collection('users_private').doc(user.uid).set(
      {
        is_onboarded: true,
        label_id: labelId,
        filters: filters,
      },
      { merge: true }
    );

    if (!!router.query.force_onboarding) {
      router.push('/');
    }
  };

  const important = (newsletters || []).filter(
    (n) => n.category === 'important'
  );
  const other = (newsletters || []).filter((n) => n.category === 'other');

  return (
    <Content>
      <div className='header flex items-center pb-2'>
        <div className='left flex-grow'>
          <div className='text-5xl font-weight-500 pb-2'>Your Newsletters</div>
          <div className='text-lg text-gray-500'>
            Choose the subscriptions you want to read in your feed
          </div>
        </div>
        <div className='right flex-none'>
          <button
            className='bg-blue-500 hover:bg-blue-700 text-white py-2 px-3 rounded'
            disabled={isCreating}
            onClick={() => onSave()}
          >
            Go to your feed
          </button>
        </div>
      </div>

      <Divider />

      {isCreating && (
        <>
          <div className='text-center pb-4 pt-12'>
            <svg className='animate-spin h-8 w-8 mx-auto' viewBox='0 0 24 24'>
              <path
                className='opacity-75'
                fill='black'
                d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
              ></path>
            </svg>
          </div>
          <div className='text-sm text-center'>
            Creating your feed now, it takes up to 30 seconds
          </div>
        </>
      )}
      {!isCreating && newsletters == null && (
        <>
          <div className='text-center pb-4 pt-12'>
            <svg className='animate-spin h-8 w-8 mx-auto' viewBox='0 0 24 24'>
              <path
                className='opacity-75'
                fill='black'
                d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
              ></path>
            </svg>
          </div>
          <div className='text-sm text-center'>
            Loading Recent Emails <br /> (This might take a minute)
          </div>
        </>
      )}
      {!isCreating && newsletters != null && (
        <>
          <table className='w-full my-2'>
            <tbody>
              {important.map((r) => (
                <OnboardingRow
                  key={r.from}
                  newsletter={r}
                  onSelected={(isSelected) => {
                    const newNewsletters = newsletters.map((nl) => {
                      if (nl.from === r.from) {
                        nl.selected = isSelected;
                      }
                      return nl;
                    });
                    setNewsletters(newNewsletters);
                  }}
                />
              ))}
            </tbody>
          </table>
          <p className='text-lg text-gray-500 pt-10'>
            Other “newsletters” in your inbox that we found less relevant
          </p>
          <table className='w-full my-2'>
            <tbody>
              {other.map((r) => (
                <OnboardingRow
                  key={r.from}
                  newsletter={r}
                  onSelected={(isSelected) => {
                    const newNewsletters = newsletters.map((nl) => {
                      if (nl.from === r.from) {
                        nl.selected = isSelected;
                      }
                      return nl;
                    });
                    setNewsletters(newNewsletters);
                  }}
                />
              ))}
            </tbody>
          </table>
        </>
      )}
    </Content>
  );
}

function OnboardingRow({
  newsletter,
  onSelected,
}: {
  newsletter: Newsletter;
  onSelected: (selected: boolean) => void;
}) {
  return (
    <tr onClick={() => onSelected(!newsletter.selected)}>
      <td className='py-3 w-12'>
        <img className='rounded-full h-8 w-8' src={newsletter.icon_url} />
      </td>
      <td>{newsletter.name}</td>
      <td className='text-right'>
        {newsletter.selected && (
          <svg
            className='block mr-0 ml-auto fill-current w-6 h-6 text-white pointer-events-none'
            viewBox='0 0 35 35'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
          >
            <circle
              cx='17.5'
              cy='17.5'
              r='16.5'
              fill='#6C7176'
              stroke='#6C7176'
              strokeWidth='2'
            />
            <rect
              x='12'
              y='23.3574'
              width='21'
              height='4'
              rx='2'
              transform='rotate(-46.9964 12 23.3574)'
              fill='white'
            />
            <rect
              x='14.4854'
              y='26.3135'
              width='12'
              height='4'
              rx='2'
              transform='rotate(-135 14.4854 26.3135)'
              fill='white'
            />
          </svg>
        )}
        {!newsletter.selected && (
          <svg
            className='block mr-0 ml-auto fill-current w-6 h-6 text-green-500 pointer-events-none'
            viewBox='0 0 24 24'
          >
            <circle
              cx='12'
              cy='12'
              r='11'
              stroke='#6C7176'
              strokeWidth='2'
              fill='none'
            />
          </svg>
        )}
      </td>
    </tr>
  );
}
