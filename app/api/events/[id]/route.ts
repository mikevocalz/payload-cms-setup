import { type NextRequest, NextResponse } from "next/server";
import { getPayload } from "@/lib/payload";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const eventId = params.id;

  try {
    const payload = await getPayload();
    
    const event = await payload.findByID({
      collection: "events",
      id: eventId,
      depth: 2,
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Get participants count
    const participantsResult = await payload.find({
      collection: "event-rsvps",
      where: {
        event: { equals: eventId },
        status: { equals: "going" },
      },
      limit: 0,
    });

    // Check if viewer has RSVP'd
    const user = await payload.auth({ headers: request.headers });
    let viewerRsvp: any = null;
    if (user.user) {
      const viewerId = String(user.user.id);
      const rsvpResult = await payload.find({
        collection: "event-rsvps",
        where: {
          event: { equals: eventId },
          user: { equals: viewerId },
        },
        limit: 1,
      });
      if (rsvpResult.totalDocs > 0) {
        viewerRsvp = rsvpResult.docs[0];
      }
    }

    return NextResponse.json({
      ...event,
      participantsCount: participantsResult.totalDocs,
      viewerRsvp,
    });
  } catch (error: any) {
    console.error("[API/events/:id] GET Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
}

export async function PUT(
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
    
    // Verify ownership
    const event = await payload.findByID({
      collection: "events",
      id: eventId,
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const hostId = typeof event.host === "object" ? (event.host as any).id : event.host;
    if (String(hostId) !== String(user.user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await payload.update({
      collection: "events",
      id: eventId,
      data: body,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[API/events/:id] PUT Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
}

export async function DELETE(
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

    // Verify ownership
    const event = await payload.findByID({
      collection: "events",
      id: eventId,
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const hostId = typeof event.host === "object" ? (event.host as any).id : event.host;
    if (String(hostId) !== String(user.user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await payload.delete({
      collection: "events",
      id: eventId,
    });

    return NextResponse.json({ success: true, id: eventId });
  } catch (error: any) {
    console.error("[API/events/:id] DELETE Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
}
