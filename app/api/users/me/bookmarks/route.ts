/**
 * User Bookmarks API Route (Next.js App Router)
 * 
 * GET /api/users/me/bookmarks - Get current user's bookmarks
 */

import { getPayload } from "payload";
import config from "@/payload.config";
import { headers } from "next/headers";

async function getUser() {
  const payload = await getPayload({ config });
  const headersList = await headers();
  
  try {
    const { user } = await payload.auth({ headers: headersList });
    return user;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  console.log("[API/bookmarks] GET user bookmarks");

  const user = await getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = String(user.id);
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10), 100);

  const payload = await getPayload({ config });

  try {
    const bookmarks = await payload.find({
      collection: "bookmarks",
      where: {
        user: { equals: userId },
      },
      sort: "-createdAt",
      page,
      limit,
      depth: 2,
    });

    // Transform to include post data
    const posts = bookmarks.docs
      .map((bookmark: any) => {
        if (!bookmark.post || typeof bookmark.post === "number") {
          return null;
        }
        return {
          ...bookmark.post,
          bookmarkId: bookmark.id,
          bookmarkedAt: bookmark.createdAt,
        };
      })
      .filter(Boolean);

    return Response.json({
      docs: posts,
      totalDocs: bookmarks.totalDocs,
      totalPages: bookmarks.totalPages,
      page: bookmarks.page,
      hasNextPage: bookmarks.hasNextPage,
      hasPrevPage: bookmarks.hasPrevPage,
    });
  } catch (err: any) {
    console.error("[API/bookmarks] Error:", err);
    return Response.json(
      { error: err.message || "Internal server error" },
      { status: err.status || 500 }
    );
  }
}
