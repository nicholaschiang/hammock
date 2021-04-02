import { google, gmail_v1 } from 'googleapis';

export default function gmail(token: string): gmail_v1.Gmail {
  const oauth2Client = new google.auth.OAuth2(
    process.env.OAUTH_CLIENT_ID,
    process.env.OAUTH_CLIENT_SECRET,
    'https://on-deck-bw.firebaseapp.com/__/auth/handler'
  );
  oauth2Client.setCredentials({ access_token: token });
  return google.gmail({ auth: oauth2Client, version: 'v1' });
}
