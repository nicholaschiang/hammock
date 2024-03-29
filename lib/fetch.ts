import { mutate } from 'swr';
import to from 'await-to-js';

import { APIError, APIErrorJSON } from 'lib/model/error';

export async function fetcher<T, D = T>(
  url: string,
  method: 'get' | 'put' | 'post' | 'patch' | 'delete' = 'get',
  data?: D
): Promise<T> {
  const body = data ? JSON.stringify(data) : undefined;
  const headers = data ? { 'Content-Type': 'application/json' } : undefined;
  const [err, res] = await to<Response>(fetch(url, { headers, method, body }));
  if (res && !res.ok) {
    const { message } = (await res.json()) as APIErrorJSON;
    const msg = `API (${url}) responded with error: ${message}`;
    throw new APIError(msg, res.status);
  } else if (err) {
    throw new APIError(`${err.name} calling API (${url}): ${err.message}`);
  } else if (!res) {
    throw new APIError(`No response from API (${url})`);
  }
  return res.json() as Promise<T>;
}

export async function prefetch(url: string): Promise<void> {
  if (url) await mutate(url, fetcher(url));
}
