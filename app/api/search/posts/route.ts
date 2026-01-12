import { type NextRequest, NextResponse } from "next/server"
import { getPayload } from "@/lib/payload"

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload()
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    if (!query) {
      return NextResponse.json({ error: "Search query required" }, { status: 400 })
    }

    const posts = await payload.find({
      collection: "posts",
      where: {
        content: {
          contains: query,
        },
      },
      sort: "-createdAt",
      page,
      limit,
      depth: 2,
    })

    return NextResponse.json(posts)
  } catch (error) {
    console.error("[v0] Post search error:", error)
    return NextResponse.json({ error: "Failed to search posts" }, { status: 500 })
  }
}
