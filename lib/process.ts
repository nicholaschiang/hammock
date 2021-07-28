import { GmailMessage } from 'lib/api/gmail';
import logger from 'lib/api/logger';
import messageFromGmail from 'lib/api/message-from-gmail';

process.on('message', (message: GmailMessage) => {
  logger.verbose('Child process received:', message);
  process.send(messageFromGmail(message));
  process.disconnect();
});
