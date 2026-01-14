const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
let supabaseHostname
let supabaseProtocol

if (supabaseUrl) {
  try {
    const parsedUrl = new URL(supabaseUrl)
    supabaseHostname = parsedUrl.hostname
    supabaseProtocol = parsedUrl.protocol.replace(":", "")
  } catch {
    supabaseHostname = undefined
    supabaseProtocol = undefined
  }
}

/** @type {import("next").NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {
    resolveAlias: {
      "pino-elasticsearch": "./lib/pino-elasticsearch-stub.js",
    },
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
