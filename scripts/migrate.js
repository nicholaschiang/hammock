const db = require('./db');

async function migrate() {
  const { docs } = await db.collection('users').get();
}

if (require.main === module) migrate();
