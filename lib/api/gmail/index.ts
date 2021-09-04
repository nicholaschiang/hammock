import { gmail_v1, google } from 'googleapis';

export type Gmail = gmail_v1.Gmail;
export type GmailMessage = gmail_v1.Schema$Message;

export default function gmail(token: string): Gmail {
  const oauth2Client = new google.auth.OAuth2(
    process.env.OAUTH_CLIENT_ID,
    process.env.OAUTH_CLIENT_SECRET
  );
  oauth2Client.setCredentials({ refresh_token: token });
  return google.gmail({ auth: oauth2Client, version: 'v1' });
}
