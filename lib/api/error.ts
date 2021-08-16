import { ServerResponse } from 'http';

import { GaxiosError } from 'gaxios';
import { captureException } from '@sentry/nextjs';

import { APIError } from 'lib/model/error';
import logger from 'lib/api/logger';

export function send(e: APIError, res: ServerResponse): void {
  const stringified = JSON.stringify(e);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Length', Buffer.byteLength(stringified));
  res.statusMessage = e.message;
  res.statusCode = e.code;
  res.end(stringified);
}

export function handle(e: unknown, res: ServerResponse): void {
  if (!(e instanceof APIError) || e.code !== 401) {
    logger.error(`API: ${(e as Error)?.stack || ''}`);
  } else {
    logger.error(`API ${e.code}: ${e.toString()}`);
  }
  captureException(e);
  // For some weird reason (I'm guessing because of different `node_modules`
  // package versions), simply using `e instanceof GaxiosError` doesn't work.
  if (e instanceof Error && typeof (e as GaxiosError).code === 'string')
    return send(new APIError(e.message, Number((e as GaxiosError).code)), res);
  if (e instanceof APIError) return send(e, res);
  if (e instanceof Error) return send(new APIError(e.message, 500), res);
  if (typeof e === 'string') return send(new APIError(e, 500), res);
  return send(new APIError('Unknown error', 500), res);
}
