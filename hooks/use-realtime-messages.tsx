"use client"

import { useEffect, useState } from "react"
import { useRealtime } from "@alejotoro-o/payload-real-time/client"

interface Message {
  id: string
  sender: string | { id: string; name: string }
  recipient: string | { id: string; name: string }
  content: string
  conversationId: string
  read: boolean
  createdAt: string
}

export function useRealtimeMessages(userId: string, conversationId: string, token?: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const realtime = useRealtime(userId, token)

  useEffect(() => {
    if (!realtime || !conversationId) return

    // Join the conversation room
    realtime.join(`conversation:${conversationId}`)

    // Listen for new messages in this conversation
    realtime.onCollection("messages", (data) => {
      const message = data.data as Message
      if (message.conversationId === conversationId) {
        setMessages((prev) => [...prev, message])
      }
    })

    // Cleanup: leave room on unmount
    return () => {
      realtime.leave(`conversation:${conversationId}`)
    }
  }, [realtime, conversationId])

  return messages
}
