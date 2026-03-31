/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "dev.mogh.dev", "mogh.dev"],
    },
  },
}

export default nextConfig
