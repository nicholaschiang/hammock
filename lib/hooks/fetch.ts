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
  unstable_serialize,
} from 'swr/infinite';
import { captureException } from '@sentry/nextjs';
import { mutate } from 'swr';

import { Callback } from 'lib/model/callback';
import { HITS_PER_PAGE } from 'lib/model/query';
import { isHighlightWithMessage } from 'lib/model/highlight';
import { isMessage } from 'lib/model/message';

export type Type = 'highlight' | 'message' | 'account';
export type Fetch<T> = Omit<SWRInfiniteResponse<T[]>, 'mutate'> & {
  mutated: (mute: boolean) => void;
  href: string;
  hasMore: boolean;
  mutateAll: (
    ...args: Parameters<SWRInfiniteResponse<T[]>['mutate']>
  ) => Promise<void>;
  mutateSingle: (resource: T, revalidate: boolean) => Promise<void>;
};

export interface FetchContextType {
  mutated: Record<Type, boolean>;
  setMutated: Callback<Record<Type, boolean>>;
  keys: Record<Type, string[]>;
  setKeys: Callback<Record<Type, string[]>>;
}
export const FetchContext = createContext<FetchContextType>({
  mutated: { highlight: false, message: false, account: false },
  setMutated: () => {},
  keys: { highlight: [], message: [], account: [] },
  setKeys: () => {},
});

// Fetch wraps `useSWRInfinite` and keeps track of which resources are being
// fetched (`highlight`). It can then be reused to mutate a single resource and
// unpause revalidations once that mutation has been updated server-side.
export default function useFetch<T extends { id: string | number }>(
  type: Type = 'message',
  url: string = '/api/messages',
  query: Record<string, string> = {},
  opts: SWRInfiniteConfiguration = {}
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
  const { mutated, setMutated, keys, setKeys } = useContext(FetchContext);
  useEffect(() => {
    setKeys((prev) => {
      if (prev[type].includes(href)) return prev;
      return { ...prev, [type]: [...prev[type], href] };
    });
  }, [type, href, setKeys]);
  useEffect(() => {
    console.log(`Revalidate ${type}?`, !mutated[type]);
  }, [type, mutated]);
  const isPaused = useCallback(() => mutated[type], [mutated, type]);
  const { data, ...rest } = useSWRInfinite<T[]>(getKey, { isPaused, ...opts });
  useEffect(() => {
    data?.flat().forEach((resource) => {
      void mutate(`${url}/${resource.id}`, resource, false);
    });
  }, [data, url]);
  return {
    ...rest,
    data,
    href,
    hasMore:
      !data || data[data.length - 1].length === HITS_PER_PAGE || mutated[type],
    async mutateAll(
      ...args: Parameters<SWRInfiniteResponse<T[]>['mutate']>
    ): Promise<void> {
      const revalidate = typeof args[1] === 'boolean' ? args[1] : true;
      console.log(`Refresh ${type}?`, revalidate);
      setMutated((prev) => ({ ...prev, [type]: !revalidate }));
      await Promise.all(
        keys[type].map((key) => {
          function keyFx(pageIdx: number, prev: T[] | null): string | null {
            if (prev && !prev.length) return null;
            if (!prev || pageIdx === 0) return key;
            return `${key}${key.includes('?') ? '&' : '?'}page=${pageIdx}`;
          }
          return mutate(unstable_serialize(keyFx), ...args);
        })
      );
    },
    async mutateSingle(resource: T, revalidate: boolean): Promise<void> {
      console.log(`Refresh single ${type}?`, revalidate);
      setMutated((prev) => ({ ...prev, [type]: !revalidate }));
      await Promise.all(
        keys[type].map((key) => {
          function keyFx(pageIdx: number, prev: T[] | null): string | null {
            if (prev && !prev.length) return null;
            if (!prev || pageIdx === 0) return key;
            return `${key}${key.includes('?') ? '&' : '?'}page=${pageIdx}`;
          }
          return mutate(
            unstable_serialize(keyFx),
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
        })
      );
    },
    mutated(mute: boolean): void {
      setMutated((prev) => ({ ...prev, [type]: mute }));
    },
  };
}
