import { getPayload as getPayloadClient } from "payload"
import config from "@/payload.config"

let cachedPayload: any = null

export async function getPayload() {
  if (cachedPayload) {
    return cachedPayload
  }

  const startTime = Date.now()
  console.log("[Payload] Initializing Payload CMS...")
  console.log("[Payload] DATABASE_URI:", process.env.DATABASE_URI ? "✓ Set" : "✗ Missing")
  
  try {
    cachedPayload = await getPayloadClient({ config })
    const duration = Date.now() - startTime
    console.log(`[Payload] ✓ Connected to database in ${duration}ms`)
    return cachedPayload
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[Payload] ✗ Failed to connect after ${duration}ms:`, error)
    throw error
  }
}
