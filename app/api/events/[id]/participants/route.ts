/**
 * Event Participants API Route
 * GET /api/events/:id/participants - Get event participants
 */

import { getPayload } from "payload";
import configPromise from "@payload-config";
import { headers } from "next/headers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  console.log("[API/events/participants] GET request for event:", eventId);

  try {
    const payload = await getPayload({ config: configPromise });

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);

    const result = await payload.find({
      collection: "event-rsvps",
      where: {
        event: { equals: eventId },
        status: { equals: "going" },
      },
      limit,
      page,
      depth: 1,
    });

    // Transform to include user avatar
    const participants = result.docs.map((rsvp: any) => {
      const user = rsvp.user;
      return {
        id: user?.id || rsvp.user,
        username: user?.username,
        displayName: user?.firstName || user?.username,
        avatarUrl: user?.avatarUrl || user?.avatar?.url,
        rsvpStatus: rsvp.status,
        rsvpDate: rsvp.createdAt,
      };
    });

    return Response.json({
      docs: participants,
      totalDocs: result.totalDocs,
      page: result.page,
      totalPages: result.totalPages,
      hasNextPage: result.hasNextPage,
    });
  } catch (error: any) {
    console.error("[API/events/participants] Error:", error);
    return Response.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
