import { APIError } from 'lib/model/error';
import logger from 'lib/api/logger';

export default function verifyBody<M>(
  body: unknown,
  isModel: (body: unknown) => body is M
): M {
  logger.verbose('Verifying request body...');
  if (!isModel(body)) throw new APIError('Invalid request body', 400);
  return body;
}
