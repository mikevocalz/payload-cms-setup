/**
 * Stories API Route
 *
 * GET  /api/stories - Get all stories (paginated)
 * POST /api/stories - Create a new story
 */

import { getPayload } from "payload";
import configPromise from "@payload-config";
import { headers } from "next/headers";

// Helper to get current user from JWT token
async function getCurrentUser(payload: any, authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.replace("JWT ", "");

  try {
    const { user } = await payload.auth({ headers: { authorization: `JWT ${token}` } });
    return user;
  } catch (error) {
    console.error("[API/stories] Auth error:", error);
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const payload = await getPayload({ config: configPromise });
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);

    // Get stories from the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const stories = await payload.find({
      collection: "stories",
      where: {
        createdAt: { greater_than: oneDayAgo },
      },
      sort: "-createdAt",
      page,
      limit,
      depth: 2,
    });

    return Response.json(stories);
  } catch (error: any) {
    console.error("[API/stories] GET error:", error);
    return Response.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = await getPayload({ config: configPromise });
    const headersList = await headers();
    const authHeader = headersList.get("authorization");

    const currentUser = await getCurrentUser(payload, authHeader);
    if (!currentUser || !currentUser.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { caption, items, media } = body;

    // Create the story
    const storyData: any = {
      author: currentUser.id,
    };

    if (caption) storyData.caption = caption;
    if (items) storyData.items = items;
    if (media) storyData.media = media;

    const newStory = await payload.create({
      collection: "stories",
      data: storyData,
      depth: 2,
    });

    console.log("[API/stories] Story created:", newStory.id);

    return Response.json({
      message: "Story created successfully",
      story: newStory,
    }, { status: 201 });
  } catch (error: any) {
    console.error("[API/stories] POST error:", error);
    return Response.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
}
