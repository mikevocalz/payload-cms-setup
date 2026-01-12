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

    const users = await payload.find({
      collection: "users",
      where: {
        or: [
          {
            username: {
              contains: query,
            },
          },
          {
            displayName: {
              contains: query,
            },
          },
        ],
      },
      page,
      limit,
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("[v0] User search error:", error)
    return NextResponse.json({ error: "Failed to search users" }, { status: 500 })
  }
}
