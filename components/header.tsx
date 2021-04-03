import { useCallback, useState } from 'react';
import { mutate } from 'swr';

import { User } from 'lib/model/user';
import { useUser } from 'lib/context/user';

export default function Header() {
  const { user } = useUser();

  const [isExpanded, setIsExpanded] = useState(false);

  const logout = useCallback(async () => {
    const { default: firebase } = await import('lib/firebase');
    await import('firebase/auth');
    await firebase.auth().signOut();
    await mutate('/api/account', new User());
  }, []);

  return (
    <div className='w-full px-4 pt-4 pb-1 fixed top-0 bg-white'>
      <button
        aria-expanded='true'
        aria-haspopup='true'
        className='block mr-0 ml-auto focus:outline-none'
        id='options-menu'
        onClick={() => setIsExpanded((prev) => !prev)}
        type='button'
      >
        <img className='rounded-full h-10 w-10' src={user.photo} />
      </button>
      {isExpanded && (
        <div className='origin-top-right absolute right-4 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5'>
          <div
            className='py-1'
            role='menu'
            aria-orientation='vertical'
            aria-labelledby='options-menu'
          >
            <a
              href='#'
              className='block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              role='menuitem'
              onClick={logout}
            >
              Logout
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
