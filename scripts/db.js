const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const logger = require('./logger');

module.exports = function db(env = process.env.NODE_ENV || 'production') {
  logger.info(`Loading ${env} environment variables...`);
  const config = {
    ...dotenv.parse(fs.readFileSync(path.resolve(__dirname, '../.env'))),
    ...dotenv.parse(fs.readFileSync(path.resolve(__dirname, '../.env.local'))),
    ...dotenv.parse(fs.readFileSync(path.resolve(__dirname, `../.env.${env}`))),
    ...dotenv.parse(
      fs.readFileSync(path.resolve(__dirname, `../.env.${env}.local`))
    ),
  };

  logger.info(
    `Using Firebase configuration: ${JSON.stringify(
      {
        projectId: config.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        serviceAccountId: config.FIREBASE_ADMIN_CLIENT_EMAIL,
        storageBucket: config.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        databaseURL: config.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      },
      null,
      2
    )}`
  );

  const admin = require('firebase-admin');
  const app = admin.initializeApp(
    {
      credential: admin.credential.cert({
        projectId: config.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        privateKey: config.FIREBASE_ADMIN_KEY.replace(/\\n/g, '\n'),
        clientEmail: config.FIREBASE_ADMIN_CLIENT_EMAIL,
      }),
      projectId: config.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      serviceAccountId: config.FIREBASE_ADMIN_CLIENT_EMAIL,
      storageBucket: config.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      databaseURL: config.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    },
    env
  );

  return app.firestore();
};
