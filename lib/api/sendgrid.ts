import mail from '@sendgrid/mail';

import { APIError } from 'lib/model/error';

export default function send(
  ...args: Parameters<typeof mail.send>
): ReturnType<typeof mail.send> {
  if (typeof process.env.SENDGRID_API_KEY !== 'string')
    throw new APIError('Missing SendGrid API key', 401);
  mail.setApiKey(process.env.SENDGRID_API_KEY);
  return mail.send(...args);
}
