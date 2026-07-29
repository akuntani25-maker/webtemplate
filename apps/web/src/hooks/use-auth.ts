'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  avatarUrl?: string | null;
}

/** Ambil sesi user saat ini via cookie (GET /auth/me). */
export function useAuth() {
  const q = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async (): Promise<SessionUser | null> => {
      try {
        const res = await api.get('/auth/me');
        return res.data.data as SessionUser;
      } catch {
        return null;
      }
    },
    staleTime: 60_000,
    retry: false,
  });
  return { user: q.data ?? null, isLoading: q.isLoading, refetch: q.refetch };
}
