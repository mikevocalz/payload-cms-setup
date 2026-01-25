import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!postId) {
      return NextResponse.json(
        { error: "postId is required" },
        { status: 400 },
      );
    }

    const payload = await getPayload({ config });

    // Fetch all comments for the post (replies disabled for now)
    const comments = await payload.find({
      collection: "comments",
      where: {
        post: {
          equals: postId,
        },
      },
      sort: "-createdAt",
      limit,
      page,
      depth: 2, // Populate author and post relationships
    });

    return NextResponse.json({
      docs: comments.docs,
      totalDocs: comments.totalDocs,
      totalPages: comments.totalPages,
      page: comments.page,
      hasNextPage: comments.hasNextPage,
      hasPrevPage: comments.hasPrevPage,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content, post, author } = body;

    console.log("[Comments API] POST received:", { content: content?.slice(0, 30), post, author });

    if (!content || !post || !author) {
      return NextResponse.json(
        { error: "content, post, and author are required", received: { content: !!content, post: !!post, author: !!author } },
        { status: 400 },
      );
    }

    const payload = await getPayload({ config });

    // Create the comment
    const comment = await payload.create({
      collection: "comments",
      data: {
        content,
        post,
        author,
      },
      depth: 2, // Populate relationships in response
    });

    console.log("[Comments API] Created comment:", comment.id);
    return NextResponse.json(comment);
  } catch (error: unknown) {
    console.error("Error creating comment:", error);
    const err = error as { message?: string; data?: unknown };
    return NextResponse.json(
      { error: "Failed to create comment", message: err?.message, details: err?.data },
      { status: 500 },
    );
  }
}
