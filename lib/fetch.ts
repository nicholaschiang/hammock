import axios, { AxiosError, AxiosResponse } from 'axios';
import to from 'await-to-js';

import { APIError, APIErrorJSON } from 'lib/api/error';

export async function fetcher<T, D = T>(
  url: string,
  method: 'get' | 'put' | 'post' | 'delete' = 'get',
  data?: D
): Promise<T> {
  const [err, res] = await to<AxiosResponse<T>, AxiosError<APIErrorJSON>>(
    axios({ method, url, data })
  );
  if (err && err.response) {
    const msg = `API (${url}) responded with error: ${err.response.data.message}`;
    throw new APIError(msg, err.response.status);
  } else if (err && err.request) {
    throw new APIError(`API (${url}) did not respond.`);
  } else if (err) {
    throw new APIError(`${err.name} calling API (${url}): ${err.message}`);
  }
  return (res as AxiosResponse<T>).data;
}