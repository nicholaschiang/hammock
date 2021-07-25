process.env.NODE_ENV = 'development';
const dev = require('./db');

process.env.NODE_ENV = 'production';
const prod = require('./db');

async function migrate() {
  const { docs } = await prod.collection('users').get();
  const batch = dev.batch();
  docs.map((doc) => {
    const data = doc.data();
    data.email = `${data.email.split('@')[0]}@example.com`;
    const ref = dev.collection('users').doc(doc.id);
    debugger;
    batch.set(ref, data);
  });
  debugger;
  await batch.commit();
}

if (require.main === module) migrate();
