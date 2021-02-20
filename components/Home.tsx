import { useRouter } from 'next/router'
import { firebase, loginOrCreateUser, TUser } from '../utils/auth'
import { useAuthState } from 'react-firebase-hooks/auth'
import { useDocumentData } from 'react-firebase-hooks/firestore';
import Header from './Header';
import Login from './Login';
import Onboarding from './Onboarding';
import Reader from './Reader';

export default function Home() {
  const [user, loading] = useAuthState(firebase.auth());

  if (loading) return null;

  if (!user) return <Login />;
  return <LoggedIn user={user} />;
}

function LoggedIn({ user }: { user: firebase.User }) {
  const router = useRouter();
  const [userValue, loading, error] = useDocumentData<TUser>(firebase.firestore().collection('users_private').doc(user.uid));

  if (loading || error) {
    return <Loading />;
  }

  const query = router.query;
  const showOnboarding = !!query.force_onboarding || !userValue.is_onboarded;

return <>
    <Header user={user} />
    {!showOnboarding && <Reader user={userValue} />}
    {showOnboarding && <Onboarding user={userValue} />}
  </>;
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
