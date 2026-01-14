import { type NextRequest, NextResponse } from "next/server"
import { getPayload } from "@/lib/payload"

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params
    const payload = await getPayload()
    const searchParams = request.nextUrl.searchParams
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const unreadOnly = searchParams.get("unread") === "true"

    const whereCondition: any = {
      recipient: {
        equals: userId,
      },
    }

    if (unreadOnly) {
      whereCondition.read = {
        equals: false,
      }
    }

    const notifications = await payload.find({
      collection: "notifications",
      where: whereCondition,
      sort: "-createdAt",
      page,
      limit,
      depth: 2,
    })

    return NextResponse.json(notifications)
  } catch (error) {
    console.error("[v0] Notifications error:", error)
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const payload = await getPayload()
    const body = await request.json()
    const { notificationIds, markAsRead } = body

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json({ error: "Invalid notification IDs" }, { status: 400 })
    }

    // Update notifications
    for (const id of notificationIds) {
      await payload.update({
        collection: "notifications",
        id,
        data: {
          read: markAsRead,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Update notifications error:", error)
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 })
  }
}
