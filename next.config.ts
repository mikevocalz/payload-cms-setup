import { withPayload } from "@payloadcms/next/withPayload"
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: process.env.NEXT_PUBLIC_SUPABASE_URL
      ? [
          {
            protocol: "https",
            hostname: process.env.NEXT_PUBLIC_SUPABASE_URL.replace("https://", ""),
          },
        ]
      : [],
    unoptimized: true,
  },
  // Turbopack config to handle problematic modules
  turbopack: {
    resolveAlias: {
      "pino-elasticsearch": "./lib/empty-module.js",
      "tap": "./lib/empty-module.js",
    },
  },
  // Externalize problematic server-only modules
  serverExternalPackages: ["pino", "pino-pretty", "thread-stream"],
  // Webpack config to handle problematic test dependencies from pino/thread-stream
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push({
        "pino-elasticsearch": "commonjs pino-elasticsearch",
        "tap": "commonjs tap",
      })
    }
    // Ignore test files from thread-stream
    config.module = config.module || {}
    config.module.rules = config.module.rules || []
    config.module.rules.push({
      test: /node_modules\/thread-stream\/test\//,
      use: "null-loader",
    })
    return config
  },
}

export default withPayload(nextConfig)
