const dev = require('./supabase')('development');
const prod = require('./supabase')('production');
const logger = require('./logger');

// Copies the users from our production database to our development database
// and replaces their email addresses with `@example.com` ones.
async function copyToDev() {
  const { data, error } = await prod.from('users').select();
  if (error) {
    logger.error(`Error fetching users: ${error.message}`);
    debugger;
  } else if (!data) {
    logger.error(`Missing data: ${data}`);
    debugger;
  } else {
    logger.info(`Saving ${data.length} users...`);
    const { error } = await dev
      .from('users')
      .insert(
        data.map((d) => ({
          ...d,
          email: `${d.email.split('@')[0]}@example.com`,
        }))
      );
    if (error) {
      logger.error(`Error inserting users: ${error.message}`);
      debugger;
    }
  }
}

if (require.main === module) copyToDev();
