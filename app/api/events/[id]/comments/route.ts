/**
 * Event Comments API Route
 * GET /api/events/:id/comments - Get event comments
 * POST /api/events/:id/comments - Create event comment
 */

import { getPayload } from "payload";
import configPromise from "@payload-config";
import { headers } from "next/headers";

// Helper to get current user from headers
async function getCurrentUser(payload: any, headersList: Headers) {
  try {
    const { user } = await payload.auth({ headers: headersList });
    return user;
  } catch (error) {
    console.error("[API/events/comments] Auth error:", error);
    return null;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  console.log("[API/events/comments] GET request for event:", eventId);

  try {
    const payload = await getPayload({ config: configPromise });

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);

    const result = await payload.find({
      collection: "event-comments" as any,
      where: {
        event: { equals: eventId },
      },
      limit,
      page,
      sort: "-createdAt",
      depth: 1,
    });

    // Transform to include author info
    const comments = result.docs.map((comment: any) => {
      const author = comment.author;
      return {
        ...comment,
        author: {
          id: author?.id || comment.author,
          username: author?.username,
          displayName: author?.firstName || author?.username,
          avatarUrl: author?.avatarUrl || author?.avatar?.url,
        },
      };
    });

    return Response.json({
      docs: comments,
      totalDocs: result.totalDocs,
      page: result.page,
      totalPages: result.totalPages,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
    });
  } catch (error: any) {
    console.error("[API/events/comments] GET Error:", error);
    return Response.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  console.log("[API/events/comments] POST request for event:", eventId);

  try {
    const payload = await getPayload({ config: configPromise });
    const headersList = await headers();

    const currentUser = await getCurrentUser(payload, headersList);
    if (!currentUser || !currentUser.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { text, content, clientMutationId } = body;
    const commentText = text || content;

    if (!commentText || typeof commentText !== "string" || commentText.trim().length === 0) {
      return Response.json({ error: "Text required" }, { status: 400 });
    }

    const userId = String(currentUser.id);

    // DEDUPE
    if (clientMutationId) {
      const existing = await payload.find({
        collection: "event-comments" as any,
        where: {
          event: { equals: eventId },
          author: { equals: userId },
          clientMutationId: { equals: clientMutationId },
        },
        limit: 1,
      });

      if (existing.totalDocs > 0) {
        return Response.json({
          ...existing.docs[0],
          deduplicated: true,
        });
      }
    }

    // Create comment
    const comment = await payload.create({
      collection: "event-comments" as any,
      data: {
        event: eventId,
        author: userId,
        content: commentText.trim(),
        clientMutationId,
      } as any,
    });

    // Get author info for response
    const author = await payload.findByID({
      collection: "users",
      id: userId,
      depth: 1,
    });

    return Response.json(
      {
        ...comment,
        author: {
          id: author?.id,
          username: (author as any)?.username,
          displayName: (author as any)?.firstName || (author as any)?.username,
          avatarUrl: (author as any)?.avatarUrl || (author as any)?.avatar?.url,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[API/events/comments] POST Error:", error);
    return Response.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
