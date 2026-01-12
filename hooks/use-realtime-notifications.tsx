"use client"

import { useEffect, useState } from "react"
import { useRealtime } from "@alejotoro-o/payload-real-time/client"

interface Notification {
  id: string
  user: string | { id: string; name: string }
  type: "like" | "comment" | "follow" | "mention"
  message: string
  read: boolean
  createdAt: string
}

export function useRealtimeNotifications(userId: string, token?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const realtime = useRealtime(userId, token)

  useEffect(() => {
    if (!realtime || !userId) return

    // Join user's notification room
    realtime.join(`user:${userId}`)

    // Listen for new notifications
    realtime.onCollection("notifications", (data) => {
      const notification = data.data as Notification
      setNotifications((prev) => [notification, ...prev])
    })

    // Cleanup: leave room on unmount
    return () => {
      realtime.leave(`user:${userId}`)
    }
  }, [realtime, userId])

  return notifications
}
