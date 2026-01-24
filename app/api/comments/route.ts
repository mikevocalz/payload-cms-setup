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

    // Fetch top-level comments (no parent) for the post
    const topLevelComments = await payload.find({
      collection: "comments",
      where: {
        and: [
          {
            post: {
              equals: postId,
            },
          },
          {
            parentComment: {
              exists: false,
            },
          },
          {
            moderationStatus: {
              equals: "approved",
            },
          },
        ],
      },
      sort: "-createdAt",
      limit,
      page,
      depth: 2, // Populate author and post relationships
    });

    // For each top-level comment, fetch its replies
    const commentsWithReplies = await Promise.all(
      topLevelComments.docs.map(async (comment) => {
        // Fetch replies for this comment
        const replies = await payload.find({
          collection: "comments",
          where: {
            and: [
              {
                parentComment: {
                  equals: comment.id,
                },
              },
              {
                moderationStatus: {
                  equals: "approved",
                },
              },
            ],
          },
          sort: "createdAt", // Sort replies chronologically
          depth: 2, // Populate author and post relationships
        });

        return {
          ...comment,
          replies: replies.docs,
        };
      }),
    );

    return NextResponse.json({
      docs: commentsWithReplies,
      totalDocs: topLevelComments.totalDocs,
      totalPages: topLevelComments.totalPages,
      page: topLevelComments.page,
      hasNextPage: topLevelComments.hasNextPage,
      hasPrevPage: topLevelComments.hasPrevPage,
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
    const { content, post, author, parentComment } = body;

    if (!content || !post || !author) {
      return NextResponse.json(
        { error: "content, post, and author are required" },
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
        parentComment: parentComment || null,
      },
      depth: 2, // Populate relationships in response
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 },
    );
  }
}
