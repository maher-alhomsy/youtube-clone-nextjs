import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  images: {
    remotePatterns: [
      {
        hostname: 'image.mux.com',
      },
      {
        hostname: '55prakvw56.ufs.sh',
      },
    ],
  },
};

export default nextConfig;
