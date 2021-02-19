import { useState } from 'react';
import { firebase, logout } from '../utils/auth'


export default function Header({ user }: { user: firebase.User }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="full-w p-4">
      <button
        aria-expanded="true"
        aria-haspopup="true"
        className="block mr-0 ml-auto focus:outline-none"
        id="options-menu"
        onClick={() => setIsExpanded(!isExpanded)}
        type="button"
      >
        <img
          className="rounded-full h-10 w-10"
          src={user.photoURL}
        />
      </button>
      {isExpanded && (
        <div className="origin-top-right absolute right-4 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            <a
              href="#"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900" role="menuitem"
              onClick={async () => {
                await logout();
              }}
            >
              Logout
            </a>
          </div>
        </div>
      )}
    </div>
  );
}