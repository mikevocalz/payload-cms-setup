import { type NextRequest, NextResponse } from "next/server";
import { getPayload } from "@/lib/payload";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const eventId = params.id;

  try {
    const payload = await getPayload();
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 100);

    const reviews = await payload.find({
      collection: "event-reviews",
      where: {
        event: { equals: eventId },
      },
      sort: "-createdAt",
      page,
      limit,
      depth: 2,
    });

    return NextResponse.json({
      docs: reviews.docs,
      totalDocs: reviews.totalDocs,
      totalPages: reviews.totalPages,
      page: reviews.page,
      hasNextPage: reviews.hasNextPage,
      hasPrevPage: reviews.hasPrevPage,
    });
  } catch (error: any) {
    console.error("[API/event-reviews] GET Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const eventId = params.id;

  try {
    const payload = await getPayload();
    const user = await payload.auth({ headers: request.headers });

    if (!user.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { rating, comment } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    const userId = String(user.user.id);

    // Check if user already reviewed this event
    const existing = await payload.find({
      collection: "event-reviews",
      where: {
        event: { equals: eventId },
        user: { equals: userId },
      },
      limit: 1,
    });

    let review;
    if (existing.totalDocs > 0) {
      // Update existing review
      review = await payload.update({
        collection: "event-reviews",
        id: String(existing.docs[0].id),
        data: {
          rating,
          comment: comment || "",
        },
      });
    } else {
      // Create new review
      review = await payload.create({
        collection: "event-reviews",
        data: {
          event: eventId,
          user: userId,
          rating,
          comment: comment || "",
        },
      });
    }

    return NextResponse.json(review);
  } catch (error: any) {
    console.error("[API/event-reviews] POST Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
}
