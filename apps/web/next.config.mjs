/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  async rewrites() {
    // Proxy panggilan /api ke backend saat dev (opsional)
    const api = process.env.NEXT_PUBLIC_API_URL;
    return api ? [] : [];
  },
};
export default nextConfig;
