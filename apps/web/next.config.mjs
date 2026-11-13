/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use standalone output in Linux / Docker container environments; omit on Windows to prevent NTFS symlink scandir EPERM errors
  output: process.env.STANDALONE === 'true' || (process.platform !== 'win32' && process.env.NODE_ENV === 'production') ? 'standalone' : undefined,
  reactStrictMode: true,
  transpilePackages: ['@omniflow/ui', '@omniflow/shared'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default nextConfig;
