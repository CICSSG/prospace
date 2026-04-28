/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
        {
            protocol: 'https',
            hostname: 'img.clerk.com',
        },
        {
          protocol: 'https',
          hostname: 'hd4ny9sgmodyi3bw.public.blob.vercel-storage.com',
        }
    ],
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    }
  },

  allowedDevOrigins: [
    '192.168.1.4'
  ],
}

export default nextConfig
