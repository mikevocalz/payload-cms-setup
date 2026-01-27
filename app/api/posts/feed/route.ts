/**
 * Posts Feed API Route
 *
 * GET /api/posts/feed - Get personalized feed for current user
 *
 * Returns posts from followed users + own posts, sorted by date.
 */

import { getPayload } from "payload";
import configPromise from "@payload-config";
import { headers } from "next/headers";

// Helper to get current user from JWT token
async function getCurrentUser(payload: any, authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith("JWT ")) {
    return null;
  }

  const token = authHeader.replace("JWT ", "");

  try {
    const { user } = await payload.auth({ headers: { authorization: `JWT ${token}` } });
    return user;
  } catch (error) {
    console.error("[API/posts/feed] Auth error:", error);
    return null;
  }
}

export async function GET(request: Request) {
  console.log("[API/posts/feed] GET request received");

  try {
    const payload = await getPayload({ config: configPromise });
    const headersList = await headers();
    const authHeader = headersList.get("authorization");
    const url = new URL(request.url);

    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);

    const currentUser = await getCurrentUser(payload, authHeader);
    
    // If not authenticated, return public posts
    if (!currentUser || !currentUser.id) {
      const publicPosts = await payload.find({
        collection: "posts",
        where: {
          visibility: { equals: "public" },
        },
        sort: "-createdAt",
        page,
        limit,
        depth: 2,
      });

      return Response.json(publicPosts);
    }

    const userId = String(currentUser.id);

    // Get users that the current user follows
    const follows = await payload.find({
      collection: "follows",
      where: {
        follower: { equals: userId },
      },
      limit: 1000,
    });

    const followingIds = follows.docs.map((f: any) => 
      typeof f.following === "object" ? f.following.id : f.following
    );

    // Include own user ID in the feed
    const feedUserIds = [...followingIds, userId];

    // Get posts from followed users and own posts
    const posts = await payload.find({
      collection: "posts",
      where: {
        author: { in: feedUserIds },
      },
      sort: "-createdAt",
      page,
      limit,
      depth: 2,
    });

    return Response.json(posts);
  } catch (error: any) {
    console.error("[API/posts/feed] Error:", error);
    return Response.json(
      { error: error.message || "Failed to fetch feed" },
      { status: error.status || 500 }
    );
  }
}
