import path from "node:path"
import { fileURLToPath } from "node:url"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pinoElasticsearchStubPath = path.join(
  __dirname,
  "lib",
  "pino-elasticsearch-stub.cjs"
)
const tapStubPath = path.join(__dirname, "lib", "tap-stub.cjs")
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
      "pino-elasticsearch": pinoElasticsearchStubPath,
      tap: tapStubPath,
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
