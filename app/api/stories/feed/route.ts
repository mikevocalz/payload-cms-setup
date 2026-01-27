/**
 * Stories Feed API Route
 *
 * GET /api/stories/feed - Get personalized stories feed
 * Returns stories from followed users and own stories
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
    console.error("[API/stories/feed] Auth error:", error);
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const payload = await getPayload({ config: configPromise });
    const headersList = await headers();
    const authHeader = headersList.get("authorization");

    // Stories feed works without auth too (shows all recent stories)
    const currentUser = await getCurrentUser(payload, authHeader);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);

    // Get stories from the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    let whereClause: any = {
      createdAt: { greater_than: oneDayAgo },
    };

    // If user is authenticated, get stories from followed users + own stories
    if (currentUser) {
      // Get list of users this user follows
      const follows = await payload.find({
        collection: "follows",
        where: {
          follower: { equals: currentUser.id },
        },
        limit: 1000,
      });

      const followedUserIds = follows.docs.map((f: any) => 
        typeof f.following === "object" ? f.following.id : f.following
      );

      // Include own user ID
      const authorIds = [...followedUserIds, currentUser.id];

      if (authorIds.length > 0) {
        whereClause = {
          and: [
            { createdAt: { greater_than: oneDayAgo } },
            { author: { in: authorIds } },
          ],
        };
      }
    }

    const stories = await payload.find({
      collection: "stories",
      where: whereClause,
      sort: "-createdAt",
      page,
      limit,
      depth: 2,
    });

    // Group stories by author for the feed
    const groupedByAuthor: Record<string, any[]> = {};
    
    for (const story of stories.docs) {
      const authorId = typeof (story as any).author === "object" 
        ? (story as any).author.id 
        : (story as any).author;
      
      if (!groupedByAuthor[authorId]) {
        groupedByAuthor[authorId] = [];
      }
      groupedByAuthor[authorId].push(story);
    }

    // Convert to array format with author info
    const feed = Object.entries(groupedByAuthor).map(([authorId, authorStories]) => {
      const firstStory = authorStories[0] as any;
      return {
        author: firstStory.author,
        stories: authorStories,
        latestAt: firstStory.createdAt,
      };
    });

    // Sort by most recent story
    feed.sort((a, b) => new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime());

    return Response.json({
      feed,
      ...stories,
      docs: undefined, // Remove flat docs, use feed instead
    });
  } catch (error: any) {
    console.error("[API/stories/feed] Error:", error);
    return Response.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
}
