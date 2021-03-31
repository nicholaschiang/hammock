import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDWSLdvNqDBZT0fu5sK-527j8Nr-yzEmNI',
  authDomain: 'on-deck-bw.firebaseapp.com',
  databaseURL: 'on-deck-bw.firebaseapp.com',
  projectId: 'on-deck-bw',
  storageBucket: 'on-deck-bw.appspot.com',
  messagingSenderId: '775004992146',
  appId: '1:775004992146:web:60d88b3d0b96fc98526c4b',
  measurementId: 'G-L5GRDP7849',
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
if (typeof window !== 'undefined') {
  firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
}

export type TUser = {
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
};

async function loginOrCreateUser() {
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/gmail.modify');
  provider.addScope('https://www.googleapis.com/auth/gmail.settings.basic');
  provider.addScope('https://www.googleapis.com/auth/gmail.labels');
  try {
    const user = await firebase.auth().signInWithPopup(provider);
    const uid = user.user.uid;
    const userRecord = await firebase
      .firestore()
      .collection('users_private')
      .doc(uid)
      .get();
    console.log(user.credential.toJSON());
    if (userRecord.exists) {
      await firebase
        .firestore()
        .collection('users_private')
        .doc(uid)
        .set(
          {
            oauth_access_token: user.credential.toJSON()['oauthAccessToken'],
            oauth_id_token: user.credential.toJSON()['oauthIdToken'],
            first_name: user.additionalUserInfo.profile['given_name'] as
              | string
              | null,
            name: user.user.displayName,
            granted_scopes: user.additionalUserInfo.profile['granted_scopes'],
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
        oauth_access_token: user.credential.toJSON()['oauthAccessToken'],
        oauth_id_token: user.credential.toJSON()['oauthIdToken'],
        first_name: user.additionalUserInfo.profile['given_name'] as
          | string
          | null,
        name: user.user.displayName,
        granted_scopes: user.additionalUserInfo.profile['granted_scopes'],
        email: user.additionalUserInfo.profile['email'],
        google_id: user.additionalUserInfo.profile['id'],
      });
    return true;
  } catch (e) {
    // TODO: Handle Error.
    console.log('Error Logging In', e);
    return false;
  }
}

async function logout() {
  return await firebase.auth().signOut();
}

async function resetOnboarding(uid: string) {
  await firebase.firestore().collection('users_private').doc(uid).set(
    {
      is_onboarded: false,
    },
    { merge: true }
  );
}

export { firebase, loginOrCreateUser, logout, resetOnboarding };
