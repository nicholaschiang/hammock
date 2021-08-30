import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import useSWRInfinite, {
  SWRInfiniteConfiguration,
  SWRInfiniteResponse,
} from 'swr/infinite';
import { mutate as globalMutate } from 'swr';

import { MessagesRes } from 'pages/api/messages';

import { HITS_PER_PAGE, MessagesQuery } from 'lib/model/query';
import { APIError } from 'lib/model/error';
import { Callback } from 'lib/model/callback';

export interface MessagesMutated {
  mutated: boolean;
  setMutated: Callback<boolean>;
}

export const MessagesMutatedContext = createContext<MessagesMutated>({
  mutated: false,
  setMutated: () => {},
});

export type Messages = SWRInfiniteResponse<MessagesRes> &
  MessagesMutated & { hasMore: boolean; href: string };

export default function useMessages(
  query: MessagesQuery = {},
  config: SWRInfiniteConfiguration = {}
): Messages {
  const href = useMemo(() => {
    const params = new URLSearchParams(query);
    const queryString = params.toString();
    return queryString ? `/api/messages?${queryString}` : '/api/messages';
  }, [query]);
  const getKey = useCallback(
    (pageIdx: number, prev: MessagesRes | null) => {
      if (prev && !prev.length) return null;
      if (!prev || pageIdx === 0) return href;
      return `${href}${href.includes('?') ? '&' : '?'}page=${pageIdx}`;
    },
    [href]
  );
  const { mutated, setMutated } = useContext(MessagesMutatedContext);
  const { data, mutate, ...rest } = useSWRInfinite<MessagesRes, APIError>(
    getKey,
    {
      revalidateIfStale: !mutated,
      revalidateOnFocus: !mutated,
      revalidateOnReconnect: !mutated,
      ...config,
    }
  );
  useEffect(() => {
    data?.flat().forEach((message) => {
      void globalMutate(`/api/messages/${message.id}`, message, false);
    });
  }, [data]);
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
  return {
    data,
    hasMore,
    href,
    mutated,
    setMutated,
    mutate: mutateMessages,
    ...rest,
  };
}
