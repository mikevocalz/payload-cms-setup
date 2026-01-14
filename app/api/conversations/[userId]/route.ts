import { type NextRequest, NextResponse } from "next/server"
import { getPayload } from "@/lib/payload"

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params
    const payload = await getPayload()

    // Get all messages for the user
    const messages = await payload.find({
      collection: "messages",
      where: {
        or: [
          {
            sender: {
              equals: userId,
            },
          },
          {
            recipient: {
              equals: userId,
            },
          },
        ],
      },
      sort: "-createdAt",
      limit: 1000,
      depth: 1,
    })

    // Group messages by conversation
    const conversationsMap = new Map()

    for (const message of messages.docs) {
      const convId = message.conversationId
      if (!conversationsMap.has(convId)) {
        conversationsMap.set(convId, {
          conversationId: convId,
          lastMessage: message,
          unreadCount: 0,
          participant: message.sender === userId ? message.recipient : message.sender,
        })
      }

      // Count unread messages
      if (!message.read && message.recipient === userId) {
        const conv = conversationsMap.get(convId)
        conv.unreadCount++
      }
    }

    const conversations = Array.from(conversationsMap.values())

    return NextResponse.json(conversations)
  } catch (error) {
    console.error("[v0] Conversations error:", error)
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 })
  }
}
