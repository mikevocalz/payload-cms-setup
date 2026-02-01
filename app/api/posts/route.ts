import { type NextRequest, NextResponse } from "next/server";
import { getPayload } from "@/lib/payload";

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload();
    const user = await payload.auth({ headers: request.headers });

    if (!user.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { content, caption, media, location, isNSFW } = body;

    if (!content && (!media || media.length === 0)) {
      return NextResponse.json(
        { error: "Post must have content or media" },
        { status: 400 }
      );
    }

    const userId = String(user.user.id);

    const post = await payload.create({
      collection: "posts",
      data: {
        author: userId,
        content: content || caption || "",
        caption: caption || "",
        media: media || [],
        location: location || "",
        isNsfw: isNSFW || false,
        likesCount: 0,
        commentsCount: 0,
        repostsCount: 0,
        bookmarksCount: 0,
        visibility: "public",
        moderationStatus: "approved",
      },
    });

    return NextResponse.json(post);
  } catch (error: any) {
    console.error("[API/posts] POST Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
}
