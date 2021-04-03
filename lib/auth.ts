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
