const db = require('./db')('production');
const supabase = require('./supabase')('production');
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
  logger.info('Fetching user docs...');
  const { docs } = await db.collection('users').get();
  logger.verbose(`Parsing ${docs.length} user docs...`);
  const users = docs
    .map((d) => d.data())
    .map((d) => ({
      id: Number(d.id),
      name: d.name,
      photo: d.photo || null,
      email: d.email || null,
      phone: d.phone || null,
      locale: d.locale || 'en-US',
      token: d.token || '',
      scopes: d.scopes || Object.values(SCOPES),
      label: d.label || '',
      filter: d.filter || '',
      subscriptions: d.subscriptions || [],
    }));
  logger.verbose(`Inserting ${docs.length} user rows...`);
  const { data, error } = await supabase.from('users').insert(users);
  /*
   *const messages = [];
   *const highlights = [];
   *await Promise.all(docs.map(async (userDoc) => {
   *  logger.verbose(`Fetching message docs for user (${userDoc.id})...`);
   *  const { docs } = await userDoc.ref
   *    .collection('messages')
   *    .orderBy('date', 'desc')
   *    .limit(50)
   *    .get();
   *  logger.verbose(`Parsing ${docs.length} message docs for user (${userDoc.id})...`);
   *  docs.map((d) => d.data()).forEach((d) => {
   *    messages.push({
   *      user: Number(userDoc.id),
   *      id: d.id,
   *      name: d.name,
   *      email: d.email,
   *      photo: d.photo,
   *      category: d.category || 'other',
   *      favorite: d.favorite,
   *      date: d.date.toDate(),
   *      subject: d.subject,
   *      snippet: d.snippet,
   *      raw: d.raw,
   *      html: d.html,
   *      archived: d.archived,
   *      scroll: d.scroll,
   *      time: d.time,
   *    });
   *    d.highlights.map((h) => {
   *      highlights.push({
   *        message: d.id,
   *        user: Number(userDoc.id),
   *        start: h.start,
   *        startOffset: h.startOffset,
   *        end: h.end,
   *        endOffset: h.endOffset,
   *        text: h.text,
   *        deleted: h.deleted,
   *      });
   *    });
   *  });
   *}));
   */
  debugger;
}

if (require.main === module) migrate();
