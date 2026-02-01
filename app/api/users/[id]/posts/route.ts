/**
 * User Posts API Route
 * GET /api/users/:id/posts
 */

import { getPayload } from "payload";
import configPromise from "@payload-config";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: userId } = await params;
  const payload = await getPayload({ config: configPromise });

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10), 100);

  const targetUserId = Number(userId);
  if (isNaN(targetUserId)) {
    return Response.json({ error: "Invalid user ID" }, { status: 400 });
  }

  try {
    const posts = await payload.find({
      collection: "posts",
      where: {
        author: { equals: targetUserId },
      },
      sort: "-createdAt",
      page,
      limit,
      depth: 2,
    });

    return Response.json(posts);
  } catch (err: any) {
    console.error("[API/user-posts] Error:", err);
    return Response.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
