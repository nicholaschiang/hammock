import firebase from 'lib/firebase';

export interface TUser {
  uid: string;
  is_onboarded: boolean;
  oauth_access_token: string;
  oauth_id_token: string;
  name: string;
  first_name: string | null;
  label_id?: string;
  filters?: {
    id: string;
    from: string;
    name: string;
  }[];
}

export async function loginOrCreateUser() {
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/gmail.modify');
  provider.addScope('https://www.googleapis.com/auth/gmail.settings.basic');
  provider.addScope('https://www.googleapis.com/auth/gmail.labels');
  try {
    const user = await firebase.auth().signInWithPopup(provider);
    const uid = user.user?.uid;
    const userRecord = await firebase
      .firestore()
      .collection('users_private')
      .doc(uid)
      .get();
    console.log(user.credential?.toJSON());
    if (userRecord.exists) {
      await firebase
        .firestore()
        .collection('users_private')
        .doc(uid)
        .set(
          {
            oauth_access_token: (user.credential?.toJSON() as any)[
              'oauthAccessToken'
            ],
            oauth_id_token: (user.credential?.toJSON() as any)['oauthIdToken'],
            first_name: (user.additionalUserInfo?.profile as any)[
              'given_name'
            ] as string | null,
            name: user.user?.displayName,
            granted_scopes: (user.additionalUserInfo?.profile as any)[
              'granted_scopes'
            ],
          },
          { merge: true }
        );
      return true;
    }
    await firebase
      .firestore()
      .collection('users_private')
      .doc(uid)
      .set({
        uid: uid,
        is_onboarded: false,
        oauth_access_token: (user.credential?.toJSON() as any)[
          'oauthAccessToken'
        ],
        oauth_id_token: (user.credential?.toJSON() as any)['oauthIdToken'],
        first_name: (user.additionalUserInfo?.profile as any)['given_name'] as
          | string
          | null,
        name: user.user?.displayName,
        granted_scopes: (user.additionalUserInfo?.profile as any)[
          'granted_scopes'
        ],
        email: (user.additionalUserInfo?.profile as any)['email'],
        google_id: (user.additionalUserInfo?.profile as any)['id'],
      });
    return true;
  } catch (e) {
    // TODO: Handle Error.
    console.log('Error Logging In', e);
    return false;
  }
}

export async function logout() {
  return await firebase.auth().signOut();
}

export async function resetOnboarding(uid: string) {
  await firebase.firestore().collection('users_private').doc(uid).set(
    {
      is_onboarded: false,
    },
    { merge: true }
  );
}
