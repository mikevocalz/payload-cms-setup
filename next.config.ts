import type { NextConfig } from "next"

const nextConfig: NextConfig = {
    typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace("https://", "") || "",
      },
    ],
    unoptimized: true,
  },
}

export default nextConfig
