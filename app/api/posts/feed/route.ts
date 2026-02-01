/**
 * Posts Feed API Route
 *
 * GET /api/posts/feed - Get personalized feed for current user
 *
 * Returns posts from followed users + own posts, sorted by date.
 * CRITICAL: Includes likesCount and isLiked for each post.
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
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10), 50);

    const currentUser = await getCurrentUser(payload, authHeader);

    // If not authenticated, return public posts with likesCount
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

      // Add likesCount for each post (no isLiked since not authenticated)
      const postIds = publicPosts.docs.map((p: any) => p.id);
      const likesCountPromises = postIds.map(async (postId: string) => {
        const count = await payload.count({
          collection: "likes",
          where: { post: { equals: postId } },
        });
        return { postId, count: count.totalDocs };
      });
      const likesCounts = await Promise.all(likesCountPromises);
      const likesCountMap = new Map(likesCounts.map(({ postId, count }) => [postId, count]));

      const enrichedDocs = publicPosts.docs.map((post: any) => ({
        ...post,
        likesCount: likesCountMap.get(post.id) || 0,
        isLiked: false,
        isBookmarked: false,
      }));

      return Response.json({
        ...publicPosts,
        docs: enrichedDocs,
      });
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

    // Get post IDs for batch queries
    const postIds = posts.docs.map((p: any) => p.id);

    // Batch fetch likes and bookmarks for current user
    const [userLikes, userBookmarks] = await Promise.all([
      payload.find({
        collection: "likes",
        where: {
          user: { equals: userId },
          post: { in: postIds },
        },
        limit: postIds.length,
      }),
      payload.find({
        collection: "bookmarks",
        where: {
          user: { equals: userId },
          post: { in: postIds },
        },
        limit: postIds.length,
      }),
    ]);

    const likedPostIds = new Set(
      userLikes.docs.map((l: any) =>
        typeof l.post === "object" ? l.post.id : l.post
      )
    );
    const bookmarkedPostIds = new Set(
      userBookmarks.docs.map((b: any) =>
        typeof b.post === "object" ? b.post.id : b.post
      )
    );

    // CRITICAL: Fetch likes counts for all posts in feed
    const likesCountPromises = postIds.map(async (postId: string) => {
      const count = await payload.count({
        collection: "likes",
        where: { post: { equals: postId } },
      });
      return { postId, count: count.totalDocs };
    });
    const likesCounts = await Promise.all(likesCountPromises);
    const likesCountMap = new Map(likesCounts.map(({ postId, count }) => [postId, count]));

    // Enrich posts with like/bookmark state and counts
    const enrichedDocs = posts.docs.map((post: any) => ({
      ...post,
      likesCount: likesCountMap.get(post.id) || 0,
      isLiked: likedPostIds.has(post.id),
      isBookmarked: bookmarkedPostIds.has(post.id),
    }));

    return Response.json({
      ...posts,
      docs: enrichedDocs,
    });
  } catch (error: any) {
    console.error("[API/posts/feed] Error:", error);
    return Response.json(
      { error: error.message || "Failed to fetch feed" },
      { status: error.status || 500 }
    );
  }
}
