/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /* Allow connecting to backend on other port */
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ];
  },
}

module.exports = nextConfig
