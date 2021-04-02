import { dequal } from 'dequal';
import { mutate } from 'swr';

import { User } from 'lib/model/user';
import { fetcher } from 'lib/fetch';

export async function logout(): Promise<void> {
  const { default: firebase } = await import('lib/firebase');
  await import('firebase/auth');
  await firebase.auth().signOut();
  await mutate('/api/account', new User());
}

export async function login(): Promise<void> {
  const { default: firebase } = await import('lib/firebase');
  await import('firebase/auth');

  const provider = new firebase.auth.GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/gmail.modify');
  provider.addScope('https://www.googleapis.com/auth/gmail.settings.basic');
  provider.addScope('https://www.googleapis.com/auth/gmail.labels');
  const cred = await firebase.auth().signInWithPopup(provider);

  if (!cred.user) throw new Error('Did not receive user information');

  const user = new User({
    id: cred.user.uid,
    name: cred.user.displayName || '',
    photo: cred.user.photoURL || '',
    email: cred.user.email || '',
    phone: cred.user.phoneNumber || '',
    token: (cred.credential as any)?.accessToken,
  });

  await mutate('/api/account', user.toJSON(), false);

  const data = await fetcher('/api/account', 'put', user.toJSON());
  if (!dequal(data, user.toJSON())) await mutate('/api/account', data, false);
}
