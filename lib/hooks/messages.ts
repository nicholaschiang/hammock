import {
  SWRInfiniteConfiguration,
  SWRInfiniteResponse,
  useSWRInfinite,
} from 'swr';
import { createContext, useCallback, useContext } from 'react';

import { MessagesQuery, MessagesRes } from 'pages/api/messages';

import { APIError } from 'lib/model/error';

// TODO: Perhaps abstract this away into the `useMessages` hook below.
interface MessagesMutatedType {
  mutated: boolean;
  setMutated: Callback<boolean>;
}
export const MessagesMutatedContext = createContext<MessagesMutatedType>({
  mutated: false,
  setMutated: () => {},
});
export const useMessagesMutated = () => useContext(MessagesMutatedContext);

export default function useMessages(
  query: MessagesQuery = {},
  config: SWRInfiniteConfiguration = { revalidateAll: true }
): SWRInfiniteResponse<MessagesRes> {
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
  return useSWRInfinite<MessagesRes, APIError>(getKey, config);
}
