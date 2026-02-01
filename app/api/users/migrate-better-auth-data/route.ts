import { type NextRequest, NextResponse } from "next/server";
import { getPayload } from "@/lib/payload";

/**
 * Migrate data from Better Auth user ID to Payload user ID
 * This updates all posts, comments, likes, follows, etc. to use the Payload user ID
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { betterAuthId, payloadUserId } = body;
    
    if (!betterAuthId || !payloadUserId) {
      return NextResponse.json(
        { error: "betterAuthId and payloadUserId are required" },
        { status: 400 }
      );
    }

    const payload = await getPayload();
    const results: Record<string, number> = {};

    console.log(`[Migration] Starting migration from ${betterAuthId} to ${payloadUserId}`);

    // Migrate Posts
    try {
      const posts = await payload.find({
        collection: "posts",
        where: { author: { equals: betterAuthId } },
        limit: 1000,
      });
      
      for (const post of posts.docs) {
        await payload.update({
          collection: "posts",
          id: post.id,
          data: { author: payloadUserId },
        });
      }
      results.posts = posts.docs.length;
      console.log(`[Migration] Updated ${posts.docs.length} posts`);
    } catch (error) {
      console.error("[Migration] Posts error:", error);
      results.posts = 0;
    }

    // Migrate Comments
    try {
      const comments = await payload.find({
        collection: "comments",
        where: { author: { equals: betterAuthId } },
        limit: 1000,
      });
      
      for (const comment of comments.docs) {
        await payload.update({
          collection: "comments",
          id: comment.id,
          data: { author: payloadUserId },
        });
      }
      results.comments = comments.docs.length;
      console.log(`[Migration] Updated ${comments.docs.length} comments`);
    } catch (error) {
      console.error("[Migration] Comments error:", error);
      results.comments = 0;
    }

    // Migrate Likes
    try {
      const likes = await payload.find({
        collection: "likes",
        where: { user: { equals: betterAuthId } },
        limit: 1000,
      });
      
      for (const like of likes.docs) {
        await payload.update({
          collection: "likes",
          id: like.id,
          data: { user: payloadUserId },
        });
      }
      results.likes = likes.docs.length;
      console.log(`[Migration] Updated ${likes.docs.length} likes`);
    } catch (error) {
      console.error("[Migration] Likes error:", error);
      results.likes = 0;
    }

    // Migrate Follows (as follower)
    try {
      const follows = await payload.find({
        collection: "follows",
        where: { follower: { equals: betterAuthId } },
        limit: 1000,
      });
      
      for (const follow of follows.docs) {
        await payload.update({
          collection: "follows",
          id: follow.id,
          data: { follower: payloadUserId },
        });
      }
      results.followsAsFollower = follows.docs.length;
      console.log(`[Migration] Updated ${follows.docs.length} follows (as follower)`);
    } catch (error) {
      console.error("[Migration] Follows (follower) error:", error);
      results.followsAsFollower = 0;
    }

    // Migrate Follows (as following)
    try {
      const follows = await payload.find({
        collection: "follows",
        where: { following: { equals: betterAuthId } },
        limit: 1000,
      });
      
      for (const follow of follows.docs) {
        await payload.update({
          collection: "follows",
          id: follow.id,
          data: { following: payloadUserId },
        });
      }
      results.followsAsFollowing = follows.docs.length;
      console.log(`[Migration] Updated ${follows.docs.length} follows (as following)`);
    } catch (error) {
      console.error("[Migration] Follows (following) error:", error);
      results.followsAsFollowing = 0;
    }

    // Migrate Bookmarks
    try {
      const bookmarks = await payload.find({
        collection: "bookmarks",
        where: { user: { equals: betterAuthId } },
        limit: 1000,
      });
      
      for (const bookmark of bookmarks.docs) {
        await payload.update({
          collection: "bookmarks",
          id: bookmark.id,
          data: { user: payloadUserId },
        });
      }
      results.bookmarks = bookmarks.docs.length;
      console.log(`[Migration] Updated ${bookmarks.docs.length} bookmarks`);
    } catch (error) {
      console.error("[Migration] Bookmarks error:", error);
      results.bookmarks = 0;
    }

    // Migrate Stories
    try {
      const stories = await payload.find({
        collection: "stories",
        where: { author: { equals: betterAuthId } },
        limit: 1000,
      });
      
      for (const story of stories.docs) {
        await payload.update({
          collection: "stories",
          id: story.id,
          data: { author: payloadUserId },
        });
      }
      results.stories = stories.docs.length;
      console.log(`[Migration] Updated ${stories.docs.length} stories`);
    } catch (error) {
      console.error("[Migration] Stories error:", error);
      results.stories = 0;
    }

    // Migrate Messages
    try {
      const messages = await payload.find({
        collection: "messages",
        where: { sender: { equals: betterAuthId } },
        limit: 1000,
      });
      
      for (const message of messages.docs) {
        await payload.update({
          collection: "messages",
          id: message.id,
          data: { sender: payloadUserId },
        });
      }
      results.messages = messages.docs.length;
      console.log(`[Migration] Updated ${messages.docs.length} messages`);
    } catch (error) {
      console.error("[Migration] Messages error:", error);
      results.messages = 0;
    }

    // Migrate Conversations (participants array)
    try {
      const conversations = await payload.find({
        collection: "conversations",
        where: { participants: { contains: betterAuthId } },
        limit: 1000,
      });
      
      for (const conversation of conversations.docs) {
        const participants = conversation.participants as string[];
        const updatedParticipants = participants.map((p: string) =>
          p === betterAuthId ? String(payloadUserId) : p
        );
        
        await payload.update({
          collection: "conversations",
          id: conversation.id,
          data: { participants: updatedParticipants },
        });
      }
      results.conversations = conversations.docs.length;
      console.log(`[Migration] Updated ${conversations.docs.length} conversations`);
    } catch (error) {
      console.error("[Migration] Conversations error:", error);
      results.conversations = 0;
    }

    const totalMigrated = Object.values(results).reduce((sum, count) => sum + count, 0);

    return NextResponse.json({
      success: true,
      message: `Migration complete: ${totalMigrated} items updated`,
      details: results,
    });
  } catch (error: any) {
    console.error("[Migration] Error:", error);
    return NextResponse.json(
      { error: error.message || "Migration failed" },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
