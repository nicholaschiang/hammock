import * as admin from 'firebase-admin';
import { nanoid } from 'nanoid';

export type FirebaseError = admin.FirebaseError & Error;

export type Firestore = admin.firestore.Firestore;
export type Timestamp = admin.firestore.Timestamp;
export type DocumentSnapshot = admin.firestore.DocumentSnapshot;
export type DocumentReference = admin.firestore.DocumentReference;
export type CollectionReference = admin.firestore.CollectionReference;

export type Auth = admin.auth.Auth;
export type UserRecord = admin.auth.UserRecord;
export type DecodedIdToken = admin.auth.DecodedIdToken;

export type App = admin.app.App;

/**
 * Initializes a new `firebase.admin` instance with limited database/Firestore
 * capabilities (using the `databaseAuthVariableOverride` option).
 * @see {@link https://firebase.google.com/docs/reference/admin/node/admin.AppOptions#optional-databaseauthvariableoverride}
 * @see {@link https://firebase.google.com/docs/database/admin/start#authenticate-with-limited-privileges}
 *
 * We have a workaround for the `FIREBASE_ADMIN_KEY` error we were encountering
 * on Vercel a while ago.
 * @see {@link https://github.com/tutorbookapp/covid-tutoring/issues/29}
 * @see {@link https://stackoverflow.com/a/41044630/10023158}
 * @see {@link https://stackoverflow.com/a/50376092/10023158}
 */
const firebase = admin.initializeApp(
  {
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      privateKey: (process.env.FIREBASE_ADMIN_KEY || '').replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    }),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    serviceAccountId: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    databaseAuthVariableOverride: { uid: 'server' },
  },
  nanoid()
);

export const auth = firebase.auth();
export const db = firebase.firestore();
export const bucket = firebase.storage().bucket();

db.settings({ ignoreUndefinedProperties: true });
