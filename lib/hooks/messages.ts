import {
  SWRInfiniteConfiguration,
  SWRInfiniteResponse,
  mutate,
  useSWRInfinite,
} from 'swr';
import { createContext, useCallback, useContext, useEffect } from 'react';

import { MessagesRes } from 'pages/api/messages';

import { APIError } from 'lib/model/error';
import { Callback } from 'lib/model/callback';
import { MessagesQuery } from 'lib/model/query';

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
  config: SWRInfiniteConfiguration = {}
): SWRInfiniteResponse<MessagesRes> {
  const getKey = useCallback(
    (pageIdx: number, prev: MessagesRes | null) => {
      const params = new URLSearchParams(query);
      if (prev && !prev.length) return null;
      if (!prev || pageIdx === 0) {
        const queryString = params.toString();
        return queryString ? `/api/messages?${queryString}` : '/api/messages';
      }
      params.append('page', pageIdx.toString());
      return `/api/messages?${params.toString()}`;
    },
    [query]
  );
  const { data, ...rest } = useSWRInfinite<MessagesRes, APIError>(
    getKey,
    config
  );
  useEffect(() => {
    data?.flat().forEach((message) => {
      void mutate(`/api/messages/${message.id}`, message, false);
    });
  }, [data]);
  return { data, ...rest };
}
