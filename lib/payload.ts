import { getPayload as getPayloadClient } from "payload"
import config from "@/payload.config"

let cachedPayload: any = null

export async function getPayload() {
  if (cachedPayload) {
    return cachedPayload
  }

  cachedPayload = await getPayloadClient({ config })
  return cachedPayload
}
