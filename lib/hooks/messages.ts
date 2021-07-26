import {
  SWRInfiniteConfiguration,
  SWRInfiniteResponse,
  useSWRInfinite,
} from 'swr';
import { useMemo } from 'react';

import { MessagesQuery, MessagesRes } from 'pages/api/messages';

import { APIError } from 'lib/model/error';

export function getKeyFunction(
  query: MessagesQuery = {}
): (pageIdx: number, prev: MessagesRes | null) => string | null {
  return (pageIdx: number, prev: MessagesRes | null) => {
    const params = new URLSearchParams(query);
    if (prev && !prev.length) return null;
    if (!prev || pageIdx === 0) {
      const queryString = params.toString();
      return queryString ? `/api/messages?${queryString}` : '/api/messages';
    }
    params.append('lastMessageId', prev[prev.length - 1].id);
    return `/api/messages?${params.toString()}`;
  };
}

export default function useMessages(
  query: MessagesQuery = {},
  config: SWRInfiniteConfiguration = { revalidateAll: true }
): SWRInfiniteResponse<MessagesRes> {
  const getKey = useMemo(() => getKeyFunction(query), [query]);
  return useSWRInfinite<MessagesRes, APIError>(getKey, config);
}
