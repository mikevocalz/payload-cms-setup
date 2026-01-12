import { type NextRequest, NextResponse } from "next/server"
import { getPayload } from "@/lib/payload"

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload()
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    // Get users that the current user follows
    const follows = await payload.find({
      collection: "follows",
      where: {
        follower: {
          equals: userId,
        },
      },
      limit: 1000,
    })

    const followingIds = follows.docs.map((f) => f.following)

    // Get posts from followed users and own posts
    const posts = await payload.find({
      collection: "posts",
      where: {
        or: [
          {
            author: {
              in: [...followingIds, userId],
            },
          },
        ],
      },
      sort: "-createdAt",
      page,
      limit,
      depth: 2,
    })

    return NextResponse.json(posts)
  } catch (error) {
    console.error("[v0] Feed error:", error)
    return NextResponse.json({ error: "Failed to fetch feed" }, { status: 500 })
  }
}
