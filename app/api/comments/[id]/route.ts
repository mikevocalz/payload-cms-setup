import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const payload = await getPayload({ config });
    const commentId = params.id;

    // Fetch the comment
    const comment = await payload.findByID({
      collection: "comments",
      id: commentId,
      depth: 2, // Populate author and post relationships
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // If this is a top-level comment, fetch its replies
    let replies: any[] = [];
    if (!comment.parentComment) {
      const repliesResult = await payload.find({
        collection: "comments",
        where: {
          and: [
            {
              parentComment: {
                equals: commentId,
              },
            },
            {
              moderationStatus: {
                equals: "approved",
              },
            },
          ],
        },
        sort: "createdAt",
        depth: 2,
      });
      replies = repliesResult.docs;
    }

    return NextResponse.json({
      ...comment,
      replies,
    });
  } catch (error) {
    console.error("Error fetching comment:", error);
    return NextResponse.json(
      { error: "Failed to fetch comment" },
      { status: 500 },
    );
  }
}
