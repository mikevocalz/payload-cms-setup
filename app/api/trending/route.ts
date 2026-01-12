import { type NextRequest, NextResponse } from "next/server"
import { getPayload } from "@/lib/payload"

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload()
    const searchParams = request.nextUrl.searchParams
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    // Get trending hashtags
    const hashtags = await payload.find({
      collection: "hashtags",
      where: {
        trending: {
          equals: true,
        },
      },
      sort: "-trendingScore",
      limit,
    })

    // Get popular posts from last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const posts = await payload.find({
      collection: "posts",
      where: {
        createdAt: {
          greater_than: oneDayAgo,
        },
      },
      sort: "-likesCount",
      limit,
      depth: 2,
    })

    return NextResponse.json({
      hashtags: hashtags.docs,
      posts: posts.docs,
    })
  } catch (error) {
    console.error("[v0] Trending error:", error)
    return NextResponse.json({ error: "Failed to fetch trending" }, { status: 500 })
  }
}
