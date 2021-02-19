import { firebase, loginOrCreateUser, TUser } from '../utils/auth'
import { useAuthState } from 'react-firebase-hooks/auth'
import { useDocumentData } from 'react-firebase-hooks/firestore';
import Header from './Header';
import Onboarding from './Onboarding';
import Reader from './Reader';

import { isNewsletter, exampleMessage3, exampleMessage2, exampleMessage1 } from '../utils/gmail'

export default function Home() {
  const [user, loading] = useAuthState(firebase.auth());

  if (loading) return null;

  if (!user) return <Login />;
  return <LoggedIn user={user} />;
}

function LoggedIn({ user }: { user: firebase.User }) {
  const [userValue, loading, error] = useDocumentData<TUser>(firebase.firestore().collection('users_private').doc(user.uid));

  if (loading || error) {
    return <Loading />;
  }

  return <>
    <Header user={user} />
    {userValue.is_onboarded && <Reader user={userValue} />}
    {!userValue.is_onboarded && <Onboarding user={userValue} />}
  </>;
}

function Login() {
  return (
    <div className="flex items-center justify-center h-screen">
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={async () => {
          await loginOrCreateUser();
        }}
      >
        Sign In With Google
      </button>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center h-screen">
      <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24">
        <path className="opacity-75" fill="black" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
  );
}
