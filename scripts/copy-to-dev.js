const dev = require('./db')('development');
const prod = require('./db')('production');
const logger = require('./logger');

// Copies the users from our production database to our development database
// and replaces their email addresses with `@example.com` ones.
async function copyToDev() {
  const { docs } = await prod.collection('users').get();
  const batch = dev.batch();
  docs.map((doc) => {
    const data = doc.data();
    data.email = `${data.email.split('@')[0]}@example.com`;
    const ref = dev.collection('users').doc(doc.id);
    logger.verbose(`Adding ${data.name} <${data.email}> to batch...`);
    batch.set(ref, data);
  });
  logger.info(`Committing batch of ${docs.length} updates...`);
  await batch.commit();
}

if (require.main === module) copyToDev();
