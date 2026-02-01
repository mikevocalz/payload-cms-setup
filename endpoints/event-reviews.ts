/**
 * Event Reviews Endpoints for Payload v3
 *
 * GET /api/events/:id/reviews - Get reviews for an event
 * POST /api/events/:id/reviews - Create/update review for an event
 */

import type { Endpoint } from "payload";

export const getEventReviewsEndpoint: Endpoint = {
  path: "/events/:id/reviews",
  method: "get",
  handler: async (req) => {
    const eventId = req.routeParams?.id as string;
    console.log("[Endpoint/event-reviews] GET reviews for event:", eventId);

    if (!eventId) {
      return Response.json({ error: "Event ID required" }, { status: 400 });
    }

    const url = new URL(req.url || "", "http://localhost");
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "10", 10), 100);

    try {
      const reviews = await req.payload.find({
        collection: "event-reviews",
        where: {
          event: { equals: eventId },
        },
        sort: "-createdAt",
        page,
        limit,
        depth: 2, // Populate user info
      });

      return Response.json({
        docs: reviews.docs,
        totalDocs: reviews.totalDocs,
        totalPages: reviews.totalPages,
        page: reviews.page,
        hasNextPage: reviews.hasNextPage,
        hasPrevPage: reviews.hasPrevPage,
      });
    } catch (err: any) {
      console.error("[Endpoint/event-reviews] Error:", err);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: err.status || 500 }
      );
    }
  },
};

export const createEventReviewEndpoint: Endpoint = {
  path: "/events/:id/reviews",
  method: "post",
  handler: async (req) => {
    const eventId = req.routeParams?.id as string;
    console.log("[Endpoint/event-reviews] POST review for event:", eventId);

    if (!req.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!eventId) {
      return Response.json({ error: "Event ID required" }, { status: 400 });
    }

    try {
      const body = await req.json();
      const { rating, comment } = body;

      if (!rating || rating < 1 || rating > 5) {
        return Response.json(
          { error: "Rating must be between 1 and 5" },
          { status: 400 }
        );
      }

      const userId = String(req.user.id);

      // Check if user already reviewed this event
      const existing = await req.payload.find({
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
        review = await req.payload.update({
          collection: "event-reviews",
          id: String(existing.docs[0].id),
          data: {
            rating,
            comment: comment || "",
          },
        });
      } else {
        // Create new review
        review = await req.payload.create({
          collection: "event-reviews",
          data: {
            event: eventId,
            user: userId,
            rating,
            comment: comment || "",
          },
        });
      }

      return Response.json(review);
    } catch (err: any) {
      console.error("[Endpoint/event-reviews] Error:", err);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: err.status || 500 }
      );
    }
  },
};
