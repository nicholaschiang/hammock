import { gmail_v1, google } from 'googleapis';

import oauth2Client from 'lib/api/oauth';

export type Gmail = gmail_v1.Gmail;
export type GmailMessage = gmail_v1.Schema$Message;

export default function gmail(token: string): Gmail {
  oauth2Client.setCredentials({ refresh_token: token });
  return google.gmail({ auth: oauth2Client, version: 'v1' });
}
