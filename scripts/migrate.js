const prod = require('./db')('production');
const logger = require('./logger');

const SCOPES = {
  EMAIL: 'https://www.googleapis.com/auth/userinfo.email',
  PROFILE: 'https://www.googleapis.com/auth/userinfo.profile',
  READ: 'https://www.googleapis.com/auth/gmail.readonly',
  LABEL: 'https://www.googleapis.com/auth/gmail.labels',
  FILTER: 'https://www.googleapis.com/auth/gmail.settings.basic',
};

// Adds the full `scopes` property to each of our users.
async function migrate() {
  const { docs } = await prod.collection('users').get();
  const batch = prod.batch();
  docs.map((doc) => {
    const data = doc.data();
    data.scopes = Object.values(SCOPES);
    logger.verbose(`Adding ${data.name} <${data.email}> to batch...`);
    batch.set(doc.ref, data);
  });
  logger.info(`Committing batch of ${docs.length} updates...`);
  await batch.commit();
}

if (require.main === module) migrate();
