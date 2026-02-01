import { type NextRequest, NextResponse } from "next/server";
import { getPayload } from "@/lib/payload";

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
    const { action } = body; // "going" or "cancel"
    const userId = String(user.user.id);

    // Check if event exists
    const event = await payload.findByID({
      collection: "events",
      id: eventId,
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check existing RSVP
    const existing = await payload.find({
      collection: "event-rsvps",
      where: {
        event: { equals: eventId },
        user: { equals: userId },
      },
      limit: 1,
    });

    if (action === "going") {
      if (existing.totalDocs > 0) {
        // Update existing RSVP
        await payload.update({
          collection: "event-rsvps",
          id: String(existing.docs[0].id),
          data: {
            status: "going",
          },
        });
      } else {
        // Create new RSVP
        await payload.create({
          collection: "event-rsvps",
          data: {
            event: eventId,
            user: userId,
            status: "going",
          },
        });
      }

      return NextResponse.json({
        success: true,
        status: "going",
        message: "RSVP confirmed",
      });
    } else if (action === "cancel") {
      if (existing.totalDocs > 0) {
        await payload.delete({
          collection: "event-rsvps",
          id: String(existing.docs[0].id),
        });
      }

      return NextResponse.json({
        success: true,
        status: "cancelled",
        message: "RSVP cancelled",
      });
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use 'going' or 'cancel'" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("[API/events/:id/rsvp] Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
}
