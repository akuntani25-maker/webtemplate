import axios, { type AxiosInstance } from 'axios';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

/**
 * Klien Axios untuk komponen client-side.
 * `withCredentials` agar cookie HttpOnly (access/refresh) ikut terkirim.
 */
export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor: coba refresh sekali saat 401, lalu ulangi request.
let refreshing: Promise<unknown> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes('/auth/')
    ) {
      original._retry = true;
      try {
        refreshing =
          refreshing ?? api.post('/auth/refresh').finally(() => {
            refreshing = null;
          });
        await refreshing;
        return api(original);
      } catch {
        // biarkan error diteruskan (user perlu login ulang)
      }
    }
    return Promise.reject(error);
  },
);

/**
 * Fetch untuk Server Components (SSR/ISR). Tidak membawa cookie user;
 * gunakan untuk data publik (katalog, blog) dengan revalidate.
 */
export async function serverFetch<T>(
  path: string,
  opts?: { revalidate?: number },
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    next: { revalidate: opts?.revalidate ?? 60 },
  });
  if (!res.ok) {
    throw new Error(`API ${path} gagal: ${res.status}`);
  }
  const json = (await res.json()) as { data: T };
  return json.data;
}
