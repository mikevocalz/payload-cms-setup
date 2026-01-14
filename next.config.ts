import type { NextConfig } from "next"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
let supabaseHostname: string | undefined
let supabaseProtocol: "http" | "https" | undefined

if (supabaseUrl) {
  try {
    const parsedUrl = new URL(supabaseUrl)
    supabaseHostname = parsedUrl.hostname
    supabaseProtocol = parsedUrl.protocol.replace(":", "") as "http" | "https"
  } catch {
    supabaseHostname = undefined
    supabaseProtocol = undefined
  }
}

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {
    resolveAlias: {
      "pino-elasticsearch": false,
    },
  webpack: (config) => {
    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "pino-elasticsearch": false,
    }
    return config
  },
  images: {
    remotePatterns:
      supabaseHostname && supabaseProtocol
        ? [
            {
              protocol: supabaseProtocol,
              hostname: supabaseHostname,
            },
          ]
        : [],
    unoptimized: true,
  },
}

export default nextConfig
