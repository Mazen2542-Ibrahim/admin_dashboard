/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "dev.mogh.dev", "mogh.dev"],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
  async headers() {
    const baseHeaders = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    ]
    return [
      {
        // Catch-all: geolocation blocked everywhere by default
        source: "/:path*",
        headers: [
          ...baseHeaders,
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        // Auth pages override: geolocation allowed for location-based login checks
        // Must come AFTER the catch-all so it wins on /login and /register
        source: "/(login|register)",
        headers: [
          ...baseHeaders,
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
        ],
      },
    ]
  },
}

export default nextConfig
