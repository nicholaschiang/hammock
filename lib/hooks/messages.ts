import {
  SWRInfiniteConfiguration,
  SWRInfiniteResponse,
  mutate as globalMutate,
  useSWRInfinite,
} from 'swr';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react';

import { MessagesRes } from 'pages/api/messages';

import { HITS_PER_PAGE, MessagesQuery } from 'lib/model/query';
import { APIError } from 'lib/model/error';
import { Callback } from 'lib/model/callback';

export const MessagesMutatedContext = createContext({
  mutated: false,
  setMutated: (() => {}) as Callback<boolean>,
});

export default function useMessages(
  query: MessagesQuery = {},
  config: SWRInfiniteConfiguration = {}
): SWRInfiniteResponse<MessagesRes> & { hasMore: boolean } {
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
  const { data, mutate, ...rest } = useSWRInfinite<MessagesRes, APIError>(
    getKey,
    config
  );
  useEffect(() => {
    data?.flat().forEach((message) => {
      void globalMutate(`/api/messages/${message.id}`, message, false);
    });
  }, [data]);
  const { mutated, setMutated } = useContext(MessagesMutatedContext);
  useEffect(() => {
    // If the message page mutates these messages to e.g. archive a message and
    // thus remove it from the `/feed` page, we have to refresh the messages so
    // that we know whether or not there's more to load in the infinite scroll
    // b/c a mutated `/api/messages` response might not have 5 messages.
    async function refresh(): Promise<void> {
      if (mutated) await mutate();
      setMutated(false);
    }
    void refresh();
  }, [mutated, setMutated, mutate]);
  const hasMore = useMemo(
    () => !data || data[data.length - 1].length === HITS_PER_PAGE || mutated,
    [data, mutated]
  );
  // TODO: How do mutations made using this bound mutate function affect SWR's
  // cache for different message queries? Ex: The feed page filters by
  // non-archived messages while the writers page filters by a specific author
  // and thus the SWR keys change but they're both using the same hook.
  // TODO: Make sure that when the message page mutates a single message, it
  // affects the SWR cache for each possible message query and that those caches
  // remain separate so they don't have to replace each other on page changes.
  const mutateMessages = useCallback(
    (...args: Parameters<typeof mutate>) => {
      setMutated(true);
      return mutate(...args);
    },
    [mutate, setMutated]
  );
  return { data, hasMore, mutate: mutateMessages, ...rest };
}
