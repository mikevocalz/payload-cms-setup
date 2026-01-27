/**
 * Follow/Unfollow API Route (Next.js App Router)
 * 
 * POST /api/users/follow - Follow a user
 * DELETE /api/users/follow - Unfollow a user
 * GET /api/users/follow - Check follow state
 */

import { getPayload } from "payload";
import config from "@/payload.config";
import { headers } from "next/headers";

async function getUser(req: Request) {
  const payload = await getPayload({ config });
  const headersList = await headers();
  const authHeader = headersList.get("authorization");
  
  if (!authHeader?.startsWith("JWT ")) {
    return null;
  }
  
  const token = authHeader.slice(4);
  
  try {
    const { user } = await payload.auth({ headers: headersList });
    return user;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  console.log("[API/follow] POST request received");
  
  const user = await getUser(req);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const followingId = body?.followingId || body?.userId;
  if (!followingId) {
    return Response.json({ error: "followingId required" }, { status: 400 });
  }

  const followerId = String(user.id);
  const targetId = String(followingId);

  if (followerId === targetId) {
    return Response.json(
      { error: "Cannot follow yourself", code: "SELF_FOLLOW_FORBIDDEN" },
      { status: 409 }
    );
  }

  const payload = await getPayload({ config });

  try {
    // Create follow - hooks handle duplicate prevention
    await payload.create({
      collection: "follows",
      data: {
        follower: followerId,
        following: targetId,
      } as any,
    });

    const targetUser = await payload.findByID({
      collection: "users",
      id: targetId,
    });

    return Response.json({
      following: true,
      message: "User followed successfully",
      followersCount: (targetUser?.followersCount as number) || 0,
    });
  } catch (err: any) {
    // IDEMPOTENT: Already following is success
    if (err.message?.includes("Already following") || err.status === 409) {
      const targetUser = await payload.findByID({
        collection: "users",
        id: targetId,
      });

      return Response.json({
        following: true,
        message: "Already following",
        followersCount: (targetUser?.followersCount as number) || 0,
      });
    }

    console.error("[API/follow] Error:", err);
    return Response.json(
      { error: err.message || "Internal server error" },
      { status: err.status || 500 }
    );
  }
}

export async function DELETE(req: Request) {
  console.log("[API/follow] DELETE request received");
  
  const user = await getUser(req);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const followingId = body?.followingId || body?.userId;
  if (!followingId) {
    return Response.json({ error: "followingId required" }, { status: 400 });
  }

  const followerId = String(user.id);
  const targetId = String(followingId);

  const payload = await getPayload({ config });

  try {
    const existing = await payload.find({
      collection: "follows",
      where: {
        follower: { equals: followerId },
        following: { equals: targetId },
      },
      limit: 1,
    });

    if (existing.totalDocs === 0) {
      const targetUser = await payload.findByID({
        collection: "users",
        id: targetId,
      });

      return Response.json({
        following: false,
        message: "Not following",
        followersCount: (targetUser?.followersCount as number) || 0,
      });
    }

    await payload.delete({
      collection: "follows",
      id: existing.docs[0].id,
    });

    const targetUser = await payload.findByID({
      collection: "users",
      id: targetId,
    });

    return Response.json({
      following: false,
      message: "User unfollowed successfully",
      followersCount: (targetUser?.followersCount as number) || 0,
    });
  } catch (err: any) {
    console.error("[API/follow] Error:", err);
    return Response.json(
      { error: err.message || "Internal server error" },
      { status: err.status || 500 }
    );
  }
}

export async function GET(req: Request) {
  const user = await getUser(req);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");

  if (!userId) {
    return Response.json({ error: "userId query parameter required" }, { status: 400 });
  }

  const followerId = String(user.id);
  const targetId = String(userId);

  const payload = await getPayload({ config });

  try {
    const existing = await payload.find({
      collection: "follows",
      where: {
        follower: { equals: followerId },
        following: { equals: targetId },
      },
      limit: 1,
    });

    return Response.json({
      following: existing.totalDocs > 0,
    });
  } catch (err: any) {
    console.error("[API/follow] GET error:", err);
    return Response.json(
      { error: err.message || "Internal server error" },
      { status: err.status || 500 }
    );
  }
}
