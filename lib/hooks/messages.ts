import { SWRInfiniteResponse, useSWRInfinite } from 'swr';
import { useCallback } from 'react';

import { MessagesQuery, MessagesRes } from 'pages/api/messages';

export default function useMessages(query: MessagesQuery = {}): SWRInfiniteResponse<MessagesRes> {
  const getKey = useCallback(
    (pageIdx: number, prev: MessagesRes | null) => {
      const params = new URLSearchParams(query);
      if (prev && !prev.length) return null;
      if (!prev || pageIdx === 0) {
        const queryString = params.toString();
        return queryString ? `/api/messages?${queryString}` : '/api/messages';
      }
      params.append('lastMessageId', prev[prev.length - 1].id);
      return `/api/messages?${params.toString()}`;
    },
    [query]
  );
  return useSWRInfinite<MessagesRes>(getKey, { revalidateAll: true });
}
