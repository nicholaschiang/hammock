import { useEffect, useState } from 'react'
import { firebase, loginOrCreateUser, logout, TUser } from '../utils/auth'
import { createFilter, createLabel, fetchNewsletters, Newsletter } from '../utils/gmail'
import Divider from './Divider'

export default function Onboarding({ user }: { user: TUser}) {
  const [newsletters, setNewsletters] = useState<Newsletter[] | null>(null);
  const [selectedNewsletters, setSelectedNewsletters] = useState<Newsletter[]>([]);

  useEffect(() => {
    const f = async () => {
      const nl = await fetchNewsletters(user.oauth_access_token);
      setNewsletters(nl);
    }
    f();
  }, []);

  const onSave = async () => {
    let labelId = user.label_id;
    if (!labelId) {
      labelId = await createLabel(user.oauth_access_token, 'Return of the Newsletter');
    }
    const filters: { id: string, from: string }[] = user.filters ?? [];
    for (const nl of selectedNewsletters) {
      if (filters.find(f => f.from === nl.from) != null) {
        continue;
      }
      const filterId = await createFilter(user.oauth_access_token, labelId, nl.from);
      filters.push({id: filterId, from: nl.from});
    }
    await firebase.firestore().collection('users_private').doc(user.uid).set({
      is_onboarded: true,
      label_id: labelId,
      filters: filters,
    }, { merge: true });
  }

  return (
    <div className="md:container md:mx-auto">
      <div className="header flex items-center">
        <div className="left flex-grow">
          <div className="text-5xl font-weight-500 pb-2">
            Your Newsletters
          </div>
          <div className="text-lg font-weight-400 text-gray-700">
            Choose the subscriptions you want to read in your feed
          </div>
        </div>
        <div className="right flex-none">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-3 rounded"
            onClick={() => onSave()}
          >
            Go to your feed
          </button>
        </div>
      </div>

      <Divider />

      {newsletters == null && <>
        <div className="text-center pb-4 pt-12">
          <svg className="animate-spin h-8 w-8 mx-auto" viewBox="0 0 24 24">
            <path className="opacity-75" fill="black" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <div className="text-sm text-center">
           Loading Recent Emails <br /> (This might take a minute)
        </div>
      </>}
      {newsletters != null && (
        <table className="w-full my-2 mx-2">
          <tbody>
          {newsletters.map(r =>
            <OnboardingRow
              key={r.from}
              newsletter={r}
              onSelected={(isSelected) => {
                if (isSelected) {
                  setSelectedNewsletters([...selectedNewsletters, r]);
                } else {
                  setSelectedNewsletters(selectedNewsletters.filter(n => n.from !== r.from))
                }
              }}
            />
          )}
          </tbody>
        </table>
      )}
    </div>
  )
}

function OnboardingRow({ newsletter, onSelected }: { newsletter: Newsletter, onSelected: (boolean) => void }) {
  console.log('OnboardingRow', newsletter.from);
  const [isSelected, setIsSelected] = useState(true);
  useEffect(() => onSelected(isSelected), [isSelected]);
  const domain = newsletter.from.slice(newsletter.from.indexOf('@') + 1);
  const googleURL = 'https://www.google.com/s2/favicons?sz=64&domain_url=' + domain;
  return (
    <tr
      onClick={() => setIsSelected(!isSelected)}
    >
      <td className="py-2 w-12">
        <img className="rounded-full h-8 w-8" src={googleURL} />
      </td>
      <td>{newsletter.name}</td>
      <td className="text-right">
        {isSelected && (
          <svg className="block mr-0 ml-auto fill-current w-5 h-5 text-white pointer-events-none" viewBox="0 0 35 35" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="17.5" cy="17.5" r="16.5" fill="#6C7176" stroke="#6C7176" strokeWidth="2"/>
            <rect x="12" y="23.3574" width="21" height="4" rx="2" transform="rotate(-46.9964 12 23.3574)" fill="white"/>
            <rect x="14.4854" y="26.3135" width="12" height="4" rx="2" transform="rotate(-135 14.4854 26.3135)" fill="white"/>
          </svg>
        )}
        {!isSelected && (
          <svg className="block mr-0 ml-auto fill-current w-5 h-5 text-green-500 pointer-events-none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="11" stroke="#6C7176" strokeWidth="2" fill="none" />
          </svg>
        )}
      </td>
    </tr>
  );
}

// {newsletters == null && (<>
//   <div className="text-base text-center pb-4">
//     Please wait while we load your history.
//   </div>
//   <div className="text-center">
//     <svg className="animate-spin h-8 w-8 mx-auto" viewBox="0 0 24 24">
//       <path className="opacity-75" fill="black" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//     </svg>
//   </div>
// </>)}
// {newsletters != null && newsletters.length === 0 && (
//   <div className="text-base text-center pb-4">
//     Ruh Roh. We didn't find any newsletters! Something must have gone wrong.
//   </div>
// )}
// {newsletters != null && newsletters.length > 0 && (

// )}

const rows = [
  {name: 'Benedict Evans', from: 'peteryang.substack.com'},
  {name: 'The Information', from: 'hello@theinformation.com'},
  {name: 'New York Times', from: 'hello@nyt.com'},
  {name: 'Benedict Evans', from: 'peteryang.substack.com'},
  {name: 'The Information', from: 'hello@theinformation.com'},
  {name: 'New York Times', from: 'hello@nyt.com'},
  {name: 'Benedict Evans', from: 'peteryang.substack.com'},
  {name: 'The Information', from: 'hello@theinformation.com'},
  {name: 'New York Times', from: 'hello@nyt.com'},
  {name: 'Benedict Evans', from: 'peteryang.substack.com'},
  {name: 'The Information', from: 'hello@theinformation.com'},
  {name: 'New York Times', from: 'hello@nyt.com'},
  {name: 'Benedict Evans', from: 'peteryang.substack.com'},
  {name: 'The Information', from: 'hello@theinformation.com'},
  {name: 'New York Times', from: 'hello@nyt.com'},
  {name: 'Benedict Evans', from: 'peteryang.substack.com'},
  {name: 'The Information', from: 'hello@theinformation.com'},
  {name: 'New York Times', from: 'hello@nyt.com'},
  {name: 'Benedict Evans', from: 'peteryang.substack.com'},
  {name: 'The Information', from: 'hello@theinformation.com'},
  {name: 'New York Times', from: 'hello@nyt.com'},
  {name: 'Benedict Evans', from: 'peteryang.substack.com'},
  {name: 'The Information', from: 'hello@theinformation.com'},
  {name: 'New York Times', from: 'hello@nyt.com'},
]
