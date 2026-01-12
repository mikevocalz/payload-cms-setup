"use client"

import { PayloadRealtimeClient } from "@alejotoro-o/payload-real-time/client"

let realtimeClient: PayloadRealtimeClient | null = null

export function getRealtimeClient(token?: string): PayloadRealtimeClient {
  if (!realtimeClient) {
    realtimeClient = new PayloadRealtimeClient({
      url: process.env.NEXT_PUBLIC_REALTIME_URL || "http://localhost:3001",
      token,
    })
  }
  return realtimeClient
}

export function disconnectRealtime() {
  if (realtimeClient) {
    realtimeClient.disconnect()
    realtimeClient = null
  }
}
