import Analytics from 'analytics-node';

const key = process.env.SEGMENT_WRITE_KEY;
const stub = {
  identify: () => stub,
  track: () => stub,
  flush: () => stub,
  page: () => stub,
  alias: () => stub,
  group: () => stub,
};

export default key ? new Analytics(key) : stub as Analytics;
