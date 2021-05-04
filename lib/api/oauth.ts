import { google } from 'googleapis';

export default new google.auth.OAuth2(
  process.env.OAUTH_CLIENT_ID,
  process.env.OAUTH_CLIENT_SECRET,
  process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI
);
