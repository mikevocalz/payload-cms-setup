/**
 * Events Endpoints for Payload v3
 *
 * GET /api/events/:id - Get event details with organizer/participants
 * POST /api/events/:id/rsvp - RSVP to event (join/leave)
 * GET /api/events/:id/participants - Get event participants list
 * POST /api/events/:id/comments - Create event comment
 * GET /api/events/:id/comments - Get event comments
 * GET /api/events/:id/ticket - Get user's ticket for event
 */

import type { Endpoint } from "payload";
import crypto from "crypto";

// Generate unique ticket token
function generateTicketToken(): string {
  return crypto.randomBytes(16).toString("hex");
}

export const getEventEndpoint: Endpoint = {
  path: "/events/:id",
  method: "get",
  handler: async (req) => {
    const eventId = req.routeParams?.id as string;
    console.log("[Endpoint/events] GET event:", eventId);

    if (!eventId) {
      return Response.json({ error: "Event ID required" }, { status: 400 });
    }

    try {
      const event = await req.payload.findByID({
        collection: "events",
        id: eventId,
        depth: 2, // Populate host/organizer
      });

      if (!event) {
        return Response.json({ error: "Event not found" }, { status: 404 });
      }

      // Get participants count
      const participantsResult = await req.payload.find({
        collection: "event-rsvps",
        where: {
          event: { equals: eventId },
          status: { equals: "going" },
        },
        limit: 0,
      });

      // Check if viewer has RSVP'd
      let viewerRsvp: any = null;
      if (req.user) {
        const viewerId = String(req.user.id);
        const rsvpResult = await req.payload.find({
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

      // Get host avatar
      let hostAvatarUrl = null;
      if (event.host && typeof event.host === "object") {
        const host = event.host as any;
        hostAvatarUrl = host.avatarUrl || host.avatar?.url;
      }

      // Resolve cover image URL (prefer coverImageUrl, fallback to image, then coverImage relation)
      const eventData = event as any;
      let resolvedCoverImageUrl = eventData.coverImageUrl || eventData.image;
      if (!resolvedCoverImageUrl && eventData.coverImage) {
        if (typeof eventData.coverImage === "object") {
          resolvedCoverImageUrl = eventData.coverImage.url;
        }
      }

      return Response.json({
        ...event,
        coverImageUrl: resolvedCoverImageUrl,
        participantsCount: participantsResult.totalDocs,
        viewerRsvpStatus: viewerRsvp?.status || null,
        viewerHasTicket: !!viewerRsvp?.ticketToken,
        hostAvatarUrl,
      });
    } catch (err: any) {
      console.error("[Endpoint/events] Error:", err);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: err.status || 500 },
      );
    }
  },
};

export const rsvpEventEndpoint: Endpoint = {
  path: "/events/:id/rsvp",
  method: "post",
  handler: async (req) => {
    const eventId = req.routeParams?.id as string;
    console.log("[Endpoint/events] POST RSVP:", eventId);

    if (!req.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!eventId) {
      return Response.json({ error: "Event ID required" }, { status: 400 });
    }

    let body: any;
    try {
      body = await req.json?.();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // status: 'going' | 'interested' | 'not_going' | null (to remove)
    const { status } = body;
    const userId = String(req.user.id);

    try {
      // Get event to check capacity
      const event = await req.payload.findByID({
        collection: "events",
        id: eventId,
      });

      if (!event) {
        return Response.json({ error: "Event not found" }, { status: 404 });
      }

      // Check existing RSVP
      const existingResult = await req.payload.find({
        collection: "event-rsvps",
        where: {
          event: { equals: eventId },
          user: { equals: userId },
        },
        limit: 1,
      });

      const existingRsvp = existingResult.docs[0];

      // Handle remove RSVP
      if (!status || status === "not_going") {
        if (existingRsvp) {
          await req.payload.delete({
            collection: "event-rsvps",
            id: existingRsvp.id,
          });
        }

        // Get updated count
        const countResult = await req.payload.find({
          collection: "event-rsvps",
          where: {
            event: { equals: eventId },
            status: { equals: "going" },
          },
          limit: 0,
        });

        return Response.json({
          rsvpStatus: null,
          participantsCount: countResult.totalDocs,
          message: "RSVP removed",
        });
      }

      // Check capacity for 'going' status
      if (status === "going" && event.maxAttendees) {
        const goingCount = await req.payload.find({
          collection: "event-rsvps",
          where: {
            event: { equals: eventId },
            status: { equals: "going" },
          },
          limit: 0,
        });

        if (goingCount.totalDocs >= (event.maxAttendees as number)) {
          return Response.json(
            { error: "Event is at capacity" },
            { status: 400 },
          );
        }
      }

      let rsvp;
      let ticketToken = (existingRsvp as any)?.ticketToken;

      // Generate ticket token if going and doesn't have one
      if (status === "going" && !ticketToken) {
        ticketToken = generateTicketToken();
      }

      if (existingRsvp) {
        // Update existing RSVP
        rsvp = await req.payload.update({
          collection: "event-rsvps",
          id: existingRsvp.id,
          data: {
            status,
            ticketToken: status === "going" ? ticketToken : null,
          } as any,
        });
      } else {
        // Create new RSVP
        rsvp = await req.payload.create({
          collection: "event-rsvps",
          data: {
            event: eventId,
            user: userId,
            status,
            ticketToken: status === "going" ? ticketToken : null,
          } as any,
        });

        // Create notification for event host
        if (event.host) {
          const hostId =
            typeof event.host === "object"
              ? (event.host as any).id
              : event.host;

          if (String(hostId) !== userId) {
            try {
              await req.payload.create({
                collection: "notifications",
                data: {
                  type: "event_rsvp",
                  recipient: hostId,
                  actor: userId,
                  event: eventId,
                  read: false,
                } as any,
              });
            } catch (e) {
              console.error(
                "[Endpoint/events] Error creating notification:",
                e,
              );
            }
          }
        }
      }

      // Get updated count
      const countResult = await req.payload.find({
        collection: "event-rsvps",
        where: {
          event: { equals: eventId },
          status: { equals: "going" },
        },
        limit: 0,
      });

      return Response.json({
        rsvpStatus: status,
        ticketToken: status === "going" ? ticketToken : null,
        participantsCount: countResult.totalDocs,
        message: `RSVP updated to ${status}`,
      });
    } catch (err: any) {
      console.error("[Endpoint/events] Error:", err);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: err.status || 500 },
      );
    }
  },
};

export const getEventParticipantsEndpoint: Endpoint = {
  path: "/events/:id/participants",
  method: "get",
  handler: async (req) => {
    const eventId = req.routeParams?.id as string;
    console.log("[Endpoint/events] GET participants:", eventId);

    if (!eventId) {
      return Response.json({ error: "Event ID required" }, { status: 400 });
    }

    const url = new URL(req.url || "", "http://localhost");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);

    try {
      const result = await req.payload.find({
        collection: "event-rsvps",
        where: {
          event: { equals: eventId },
          status: { equals: "going" },
        },
        limit,
        page,
        depth: 1, // Populate user
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
    } catch (err: any) {
      console.error("[Endpoint/events] Error:", err);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: err.status || 500 },
      );
    }
  },
};

export const createEventCommentEndpoint: Endpoint = {
  path: "/events/:id/comments",
  method: "post",
  handler: async (req) => {
    const eventId = req.routeParams?.id as string;
    console.log("[Endpoint/events] POST comment:", eventId);

    if (!req.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!eventId) {
      return Response.json({ error: "Event ID required" }, { status: 400 });
    }

    let body: any;
    try {
      body = await req.json?.();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { text, clientMutationId } = body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return Response.json({ error: "Text required" }, { status: 400 });
    }

    const userId = String(req.user.id);

    try {
      // DEDUPE
      if (clientMutationId) {
        const existing = await req.payload.find({
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
      const comment = await req.payload.create({
        collection: "event-comments" as any,
        data: {
          event: eventId,
          author: userId,
          text: text.trim(),
          clientMutationId,
        } as any,
      });

      // Get author info for response
      const author = await req.payload.findByID({
        collection: "users",
        id: userId,
        depth: 1,
      });

      // Create notification for event host
      const event = await req.payload.findByID({
        collection: "events",
        id: eventId,
      });

      if (event?.host) {
        const hostId =
          typeof event.host === "object" ? (event.host as any).id : event.host;

        if (String(hostId) !== userId) {
          try {
            await req.payload.create({
              collection: "notifications",
              data: {
                type: "event_comment",
                recipient: hostId,
                actor: userId,
                event: eventId,
                read: false,
              } as any,
            });
          } catch (e) {
            console.error("[Endpoint/events] Error creating notification:", e);
          }
        }
      }

      return Response.json(
        {
          ...comment,
          author: {
            id: author?.id,
            username: (author as any)?.username,
            displayName:
              (author as any)?.firstName || (author as any)?.username,
            avatarUrl:
              (author as any)?.avatarUrl || (author as any)?.avatar?.url,
          },
        },
        { status: 201 },
      );
    } catch (err: any) {
      console.error("[Endpoint/events] Error:", err);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: err.status || 500 },
      );
    }
  },
};

export const getEventCommentsEndpoint: Endpoint = {
  path: "/events/:id/comments",
  method: "get",
  handler: async (req) => {
    const eventId = req.routeParams?.id as string;
    console.log("[Endpoint/events] GET comments:", eventId);

    if (!eventId) {
      return Response.json({ error: "Event ID required" }, { status: 400 });
    }

    const url = new URL(req.url || "", "http://localhost");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);

    try {
      const result = await req.payload.find({
        collection: "event-comments" as any,
        where: {
          event: { equals: eventId },
        },
        limit,
        page,
        sort: "-createdAt",
        depth: 1,
      });

      // Transform to include author avatar
      const comments = result.docs.map((comment: any) => {
        const author = comment.author;
        return {
          id: comment.id,
          text: comment.text,
          createdAt: comment.createdAt,
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
      });
    } catch (err: any) {
      console.error("[Endpoint/events] Error:", err);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: err.status || 500 },
      );
    }
  },
};

export const getEventTicketEndpoint: Endpoint = {
  path: "/events/:id/ticket",
  method: "get",
  handler: async (req) => {
    const eventId = req.routeParams?.id as string;
    console.log("[Endpoint/events] GET ticket:", eventId);

    if (!req.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!eventId) {
      return Response.json({ error: "Event ID required" }, { status: 400 });
    }

    const userId = String(req.user.id);

    try {
      const result = await req.payload.find({
        collection: "event-rsvps",
        where: {
          event: { equals: eventId },
          user: { equals: userId },
          status: { equals: "going" },
        },
        limit: 1,
        depth: 1,
      });

      if (result.totalDocs === 0) {
        return Response.json(
          { error: "No ticket found. RSVP as 'going' to get a ticket." },
          { status: 404 },
        );
      }

      const rsvp = result.docs[0] as any;
      const event = rsvp.event;

      return Response.json({
        ticketToken: rsvp.ticketToken,
        eventId: event?.id || eventId,
        eventTitle: event?.title,
        eventDate: event?.date || event?.startDate,
        eventLocation: event?.location,
        userId,
        rsvpDate: rsvp.createdAt,
      });
    } catch (err: any) {
      console.error("[Endpoint/events] Error:", err);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: err.status || 500 },
      );
    }
  },
};
