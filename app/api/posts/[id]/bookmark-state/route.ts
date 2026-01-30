/**
 * Bookmark State API Route
 *
 * GET /api/posts/:id/bookmark-state - Check if current user has bookmarked a post
 */

import { getPayload } from "payload";
import configPromise from "@payload-config";
import { headers } from "next/headers";

// Helper to get current user from headers - MUST pass raw headersList
async function getCurrentUser(payload: any, headersList: Headers) {
  try {
    const { user } = await payload.auth({ headers: headersList });
    return user;
  } catch (error) {
    console.error("[API/posts/bookmark-state] Auth error:", error);
    return null;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: postId } = await params;

  try {
    const payload = await getPayload({ config: configPromise });
    const headersList = await headers();

    const currentUser = await getCurrentUser(payload, headersList);
    if (!currentUser || !currentUser.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = String(currentUser.id);
    const targetPostId = String(postId);

    const existingBookmark = await payload.find({
      collection: "bookmarks",
      where: {
        and: [{ user: { equals: userId } }, { post: { equals: targetPostId } }],
      },
      limit: 1,
    });

    const isBookmarked =
      existingBookmark.docs && existingBookmark.docs.length > 0;
    return Response.json({ bookmarked: isBookmarked, postId: targetPostId });
  } catch (error: any) {
    console.error("[API/posts/bookmark-state] Error:", error);
    return Response.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 },
    );
  }
}
