import { ServerResponse } from 'http';
import { GaxiosError } from 'gaxios';

import { APIError } from 'lib/model/error';
import logger from 'lib/api/logger';

function send(e: APIError, res: ServerResponse): void {
  const stringified = JSON.stringify(e);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Length', Buffer.byteLength(stringified));
  res.statusMessage = e.message;
  res.statusCode = e.code;
  res.end(stringified);
}

export function handle(e: unknown, res: ServerResponse): void {
  if (!(e instanceof APIError) || e.code !== 401)
    logger.error(`API encountered: ${(e as any)?.stack}`);
  if (e instanceof GaxiosError)
    return send(new APIError(e.message, Number(e.code || 500)), res);
  if (e instanceof APIError) return send(e, res);
  if (e instanceof Error) return send(new APIError(e.message, 500), res);
  if (typeof e === 'string') return send(new APIError(e, 500), res);
  return send(new APIError('Unknown error', 500), res);
}
