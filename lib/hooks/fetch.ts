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
import { captureException } from '@sentry/nextjs';
import { mutate as globalMutate } from 'swr';

import { Callback } from 'lib/model/callback';
import { HITS_PER_PAGE } from 'lib/model/query';
import { isHighlightWithMessage } from 'lib/model/highlight';
import { isMessage } from 'lib/model/message';

export type Type = 'highlight' | 'message' | 'account';
export type Mutated = { [type in Type]: boolean };
export type Fetch<T> = Omit<SWRInfiniteResponse<T[]>, 'mutate'> & {
  mutated: (mute: boolean) => void;
  href: string;
  hasMore: boolean;
} & { mutateAll: SWRInfiniteResponse<T[]>['mutate'] } & {
  mutateSingle: (
    resource: T,
    revalidate: boolean
  ) => ReturnType<SWRInfiniteResponse<T[]>['mutate']>;
};

export const MutatedContext = createContext({
  mutated: { highlight: false, message: false, account: false },
  setMutated: (() => {}) as Callback<Mutated>,
});

// Fetch wraps `useSWRInfinite` and keeps track of which resources are being
// fetched (`highlight`). It can then be reused to mutate a single resource and
// unpause revalidations once that mutation has been updated server-side.
export default function useFetch<T extends { id: string | number }>(
  type: Type = 'message',
  url: string = '/api/messages',
  query: Record<string, string> = {},
  options: SWRInfiniteConfiguration = {}
): Fetch<T> {
  const href = useMemo(() => {
    const params = new URLSearchParams(query);
    const queryString = params.toString();
    return queryString ? `${url}?${queryString}` : url;
  }, [query, url]);
  const getKey = useCallback(
    (pageIdx: number, prev: T[] | null) => {
      if (prev && !prev.length) return null;
      if (!prev || pageIdx === 0) return href;
      return `${href}${href.includes('?') ? '&' : '?'}page=${pageIdx}`;
    },
    [href]
  );
  const { mutated, setMutated } = useContext(MutatedContext);
  const { data, mutate, ...rest } = useSWRInfinite<T[]>(getKey, {
    revalidateIfStale: !mutated[type],
    revalidateOnFocus: !mutated[type],
    revalidateOnReconnect: !mutated[type],
    ...options,
  });
  useEffect(() => {
    data?.flat().forEach((resource) => {
      void globalMutate(`${url}/${resource.id}`, resource, false);
    });
  }, [data, url]);
  return {
    ...rest,
    data,
    href,
    hasMore:
      !data || data[data.length - 1].length === HITS_PER_PAGE || mutated[type],
    mutateAll(...args: Parameters<typeof mutate>): ReturnType<typeof mutate> {
      const revalidate = typeof args[1] === 'boolean' ? args[1] : true;
      setMutated((prev) => ({ ...prev, [type]: !revalidate }));
      return mutate(...args);
    },
    mutateSingle(resource: T, revalidate: boolean): ReturnType<typeof mutate> {
      setMutated((prev) => ({ ...prev, [type]: !revalidate }));
      return mutate(
        (response?: T[][]) =>
          response?.map((res: T[]) => {
            const idx = res.findIndex((m) => m.id === resource.id);
            // TODO: Insert this new resource into the correct sort position.
            if (idx < 0) return [resource, ...res];
            try {
              if (isMessage(resource) && resource.archived)
                return [...res.slice(0, idx), ...res.slice(idx + 1)];
            } catch (e) {
              captureException(e);
            }
            try {
              if (isHighlightWithMessage(resource) && resource.deleted)
                return [...res.slice(0, idx), ...res.slice(idx + 1)];
            } catch (e) {
              captureException(e);
            }
            return [...res.slice(0, idx), resource, ...res.slice(idx + 1)];
          }),
        revalidate
      );
    },
    mutated(mute: boolean): void {
      setMutated((prev) => ({ ...prev, [type]: mute }));
    },
  };
}
