'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { api } from './api';

/** GET helper yang membongkar `{ data, meta }`. */
async function get<T>(path: string): Promise<{ data: T; meta?: unknown }> {
  const res = await api.get(path);
  return res.data;
}

/** Query admin generik. */
export function useAdminQuery<T>(
  key: (string | number)[],
  path: string,
  options?: Partial<UseQueryOptions<{ data: T; meta?: unknown }>>,
) {
  return useQuery({
    queryKey: key,
    queryFn: () => get<T>(path),
    ...options,
  });
}

/** Mutasi admin generik (POST/PATCH/PUT/DELETE) dengan invalidasi. */
export function useAdminMutation<TVars = unknown, TData = unknown>(opts: {
  method: 'post' | 'patch' | 'put' | 'delete';
  path: (vars: TVars) => string;
  body?: (vars: TVars) => unknown;
  invalidate?: (string | number)[][];
}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: TVars): Promise<TData> => {
      const url = opts.path(vars);
      const body = opts.body ? opts.body(vars) : undefined;
      const res =
        opts.method === 'delete'
          ? await api.delete(url)
          : await api[opts.method](url, body);
      return res.data?.data as TData;
    },
    onSuccess: () => {
      opts.invalidate?.forEach((k) => qc.invalidateQueries({ queryKey: k }));
    },
  });
}
